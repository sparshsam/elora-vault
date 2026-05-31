import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/* ── Ensure Prisma User exists ───────────────────────── */

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

/* ── GET /api/sessions — list all sessions for the user ─── */

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureUser(user);

    const sessions = await prisma.session.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(
      sessions.map((s) => ({
        id: s.id,
        title: s.title ?? "",
        category: s.category ?? "",
        outcome: s.outcome,
        pnl: s.pnl,
        bankrollBefore: s.bankrollBefore,
        bankrollAfter: s.bankrollAfter,
        actionTaken: s.actionTaken,
        horizonId: s.horizonId ?? undefined,
        notes: s.notes ?? undefined,
        createdAt: s.createdAt.toISOString(),
      })),
    );
  } catch (error) {
    console.error("[sessions] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ── POST /api/sessions — create a new session ─────────── */

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureUser(user);

    const body = await request.json();
    const {
      outcome,
      pnl,
      bankrollBefore,
      bankrollAfter,
      actionTaken,
      horizonId,
      category,
      title,
      notes,
    } = body;

    // Basic validation
    if (!["won", "lost", "break-even"].includes(outcome)) {
      return NextResponse.json({ error: "Invalid outcome" }, { status: 400 });
    }

    // Look up wallet address
    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    });

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        wallet_address: wallet?.wallet_address,
        title: title ?? null,
        category: category ?? null,
        outcome,
        pnl: pnl ?? 0,
        bankrollBefore: bankrollBefore ?? 0,
        bankrollAfter: bankrollAfter ?? 0,
        actionTaken: actionTaken ?? "kept-available",
        horizonId: horizonId ?? null,
        notes: notes ?? null,
      },
    });

    return NextResponse.json(
      {
        id: session.id,
        title: session.title ?? "",
        category: session.category ?? "",
        outcome: session.outcome,
        pnl: session.pnl,
        bankrollBefore: session.bankrollBefore,
        bankrollAfter: session.bankrollAfter,
        actionTaken: session.actionTaken,
        horizonId: session.horizonId ?? undefined,
        notes: session.notes ?? undefined,
        createdAt: session.createdAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[sessions] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
