import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/* ── Helpers ─────────────────────────────────────────── */

function calculateProfit(odds: number, stake: number): number {
  if (odds > 0) return stake * odds / 100;
  return stake * 100 / Math.abs(odds);
}

function calculateTotalReturn(odds: number, stake: number): number {
  return stake + calculateProfit(odds, stake);
}

/* ── GET /api/bets — list bets ────────────────────────── */

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "50");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId: user.id };
    if (status && ["OPEN", "WON", "LOST", "PUSH"].includes(status)) {
      where.status = status;
    }

    const [bets, total] = await Promise.all([
      prisma.bet.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
      prisma.bet.count({ where }),
    ]);

    return NextResponse.json({ bets, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("[bets] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ── POST /api/bets — log a new bet ──────────────────── */

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { description, betType, odds, stake } = body;

    if (!odds || !stake || stake <= 0) {
      return NextResponse.json({ error: "Missing required fields: odds, stake" }, { status: 400 });
    }

    if (stake > 100000) {
      return NextResponse.json({ error: "Stake exceeds maximum" }, { status: 400 });
    }

    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found. Deposit funds first." }, { status: 404 });
    }

    if (stake > wallet.user_balance) {
      return NextResponse.json({ error: "Stake exceeds available balance" }, { status: 400 });
    }

    const profit = calculateProfit(odds, stake);
    const totalReturn = calculateTotalReturn(odds, stake);

    // Deduct from user_balance, add to at_risk_balance
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        user_balance: { decrement: stake },
        at_risk_balance: { increment: stake },
        total_wagered: { increment: stake },
      },
    });

    const updatedWallet = await prisma.wallet.findUnique({ where: { userId: user.id } });

    const bet = await prisma.bet.create({
      data: {
        userId: user.id,
        description: description || "",
        sport: "Other",
        marketType: (betType?.toUpperCase?.() === "SPREAD" ? "SPREAD" : betType?.toUpperCase?.() === "TOTAL" ? "TOTAL" : "MONEYLINE") as "MONEYLINE" | "SPREAD" | "TOTAL",
        selection: description || "",
        odds,
        stake,
        potentialProfit: profit,
        potential_return: totalReturn,
        user_balance_before: wallet.user_balance,
        user_balance_after: updatedWallet?.user_balance ?? wallet.user_balance - stake,
        at_risk_before: wallet.at_risk_balance,
        at_risk_after: (updatedWallet?.at_risk_balance ?? wallet.at_risk_balance + stake),
      },
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "BET_PLACED",
        amount: stake,
        balanceBefore: wallet.user_balance,
        balanceAfter: updatedWallet?.user_balance ?? wallet.user_balance - stake,
        betId: bet.id,
        description: description
          ? `Bet logged: ${description} ($${stake.toFixed(2)} at ${odds > 0 ? "+" : ""}${odds})`
          : `Bet logged: $${stake.toFixed(2)} at ${odds > 0 ? "+" : ""}${odds}`,
      },
    });

    return NextResponse.json(bet, { status: 201 });
  } catch (error) {
    console.error("[bets] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
