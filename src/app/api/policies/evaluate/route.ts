/**
 * GET /api/policies/evaluate
 *
 * Evaluates all active user-defined policies against current capital state
 * and recent activity. Returns structured suggestions that require user
 * confirmation before any execution layer acts on them.
 *
 * This is a STATE-based evaluation ("how does my capital look right now?").
 * Event-driven evaluation (for real-time triggers) would be called from
 * the respective event handlers directly.
 *
 * Design invariants:
 *   - No transaction execution
 *   - No automatic locking, releasing, withdrawing, or protecting
 *   - All suggestions have requiresConfirmation: true
 *   - Output is purely informational + intent-driven
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { evaluatePoliciesForState } from "@/lib/policies/policy-runtime-evaluator";
import type { ProtectionPolicy } from "@/types/policy";
import type { PolicyCondition, PolicyAction } from "@/types/policy";
import type { RuntimeEvaluationInput } from "@/types/policy-orchestration";

/**
 * Ensure the Prisma User record exists for the given Supabase user.
 */
async function ensureUser(supabaseUser: { id: string; email?: string | null }) {
  try {
    await prisma.user.upsert({
      where: { id: supabaseUser.id },
      update: {},
      create: {
        id: supabaseUser.id,
        email: supabaseUser.email ?? `user-${supabaseUser.id.slice(0, 8)}@placeholder.elora`,
      },
    });
  } catch {
    // Silently handled
  }
}

/**
 * Calculate previous sessions' consecutive losses leading up to the most recent.
 * Scans sessions from newest to oldest, counting losses before the first non-loss.
 */
function countConsecutiveLosses(sessions: { outcome: string }[]): number {
  let count = 0;
  for (const s of sessions) {
    if (s.outcome === "lost") {
      count++;
    } else {
      break; // Stop at first non-loss (sessions are ordered newest-first)
    }
  }
  return count;
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureUser(user);

    // Optional: ?skipCooldown=true to force re-evaluation
    const url = new URL(request.url);
    const skipCooldown = url.searchParams.get("skipCooldown") === "true";

    // ── 1. Fetch active policies ────────────────────────────────────
    const policyRecords = await prisma.policy.findMany({
      where: {
        userId: user.id,
        status: "active",
      },
    });

    const activePolicies: ProtectionPolicy[] = policyRecords.map((r) => ({
      id: r.id,
      title: r.title,
      type: r.type as ProtectionPolicy["type"],
      status: r.status as ProtectionPolicy["status"],
      condition: r.condition as unknown as PolicyCondition,
      action: r.action as unknown as PolicyAction,
      description: r.description ?? undefined,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    // ── 2. Fetch capital state ──────────────────────────────────────
    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    });

    const capital = {
      available: wallet?.available_vault_balance ?? 0,
      protected: wallet?.locked_vault_balance ?? 0,
      releasing: 0, // Computed from vault locks below
      committed: wallet?.at_risk_balance ?? 0,
    };

    // ── 3. Fetch active vault locks for protected/releasing amounts ──
    const vaultLocks = await prisma.vaultLock.findMany({
      where: {
        userId: user.id,
        status: { in: ["ACTIVE", "UNLOCKED"] },
      },
      select: {
        id: true,
        amount: true,
        status: true,
        unlockAt: true,
        createdAt: true,
      },
    });

    const now = new Date();
    const activeHorizons = vaultLocks
      .filter((l) => l.status === "ACTIVE" && l.unlockAt > now)
      .map((l) => ({
        id: l.id,
        amount: l.amount,
        durationDays: Math.ceil(
          (l.unlockAt.getTime() - l.createdAt.getTime()) / 86400000,
        ),
      }));

    // Releasing capital: locks that have reached unlockAt but are still "ACTIVE" or "UNLOCKED"
    const releasingLocks = vaultLocks.filter(
      (l) => l.unlockAt <= now,
    );
    const releasingAmount = releasingLocks.reduce(
      (sum, l) => sum + l.amount,
      0,
    );
    capital.releasing = releasingAmount;

    // ── 4. Fetch recent activity (last 7 days) ──────────────────────
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);

    const [sessions, transactions, recentBets] = await Promise.all([
      // Recent sessions
      prisma.session.findMany({
        where: {
          userId: user.id,
          createdAt: { gte: sevenDaysAgo },
        },
        orderBy: { createdAt: "desc" },
        select: {
          outcome: true,
          pnl: true,
        },
      }),

      // Recent transactions
      prisma.transaction.findMany({
        where: {
          userId: user.id,
          createdAt: { gte: sevenDaysAgo },
        },
        select: {
          type: true,
          amount: true,
        },
      }),

      // Recent won bets with profit
      prisma.bet.findMany({
        where: {
          userId: user.id,
          status: "WON",
          settledAt: { gte: sevenDaysAgo },
        },
        orderBy: { settledAt: "desc" },
        select: {
          id: true,
          description: true,
          potentialProfit: true,
        },
      }),
    ]);

    // ── 5. Build evaluation input ───────────────────────────────────
    const predictionsWon = sessions.filter((s) => s.outcome === "won").length;
    const predictionsLost = sessions.filter((s) => s.outcome === "lost").length;

    const recentWins = recentBets.map((b) => ({
      id: b.id,
      description: b.description || "Prediction",
      profit: b.potentialProfit || 0,
    }));

    const activitySummary = {
      totalDeposits: transactions
        .filter((t) => t.type === "ONCHAIN_DEPOSIT" || t.type === "DEPOSIT")
        .reduce((s, t) => s + t.amount, 0),
      totalWithdrawals: transactions
        .filter((t) => t.type === "ONCHAIN_WITHDRAWAL" || t.type === "WITHDRAWAL")
        .reduce((s, t) => s + t.amount, 0),
      totalProtected: transactions
        .filter((t) => t.type === "ONCHAIN_LOCK_CREATED" || t.type === "LOCK_CREATED")
        .reduce((s, t) => s + t.amount, 0),
      totalReleased: transactions
        .filter((t) => t.type === "ONCHAIN_LOCK_RELEASED" || t.type === "LOCK_RELEASED")
        .reduce((s, t) => s + t.amount, 0),
      predictionsWon,
      predictionsLost,
      consecutiveLosses: countConsecutiveLosses(sessions),
    };

    const input: RuntimeEvaluationInput = {
      capital,
      recentActivity: activitySummary,
      recentWins,
      activeHorizons,
    };

    // ── 6. Run state evaluation ─────────────────────────────────────
    const suggestions = evaluatePoliciesForState(activePolicies, input, skipCooldown);

    // ── 7. Build response ───────────────────────────────────────────
    return NextResponse.json({
      evaluatedAt: Date.now(),
      policyCount: activePolicies.length,
      suggestionCount: suggestions.length,
      capital: {
        available: capital.available,
        protected: capital.protected,
        releasing: capital.releasing,
        committed: capital.committed,
      },
      activity: {
        predictionsWon,
        predictionsLost,
        consecutiveLosses: activitySummary.consecutiveLosses,
      },
      suggestions,
    });
  } catch (error) {
    console.error("Error evaluating policies:", error);
    return NextResponse.json(
      { error: "Failed to evaluate policies." },
      { status: 500 },
    );
  }
}
