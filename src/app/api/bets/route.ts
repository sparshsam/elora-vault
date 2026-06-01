import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { STORED_TX_TYPES } from "@/lib/transaction-types";
import { createPredictionSchema, formatZodErrors } from "@/lib/validation";

function calculateProfit(odds: number, stake: number): number {
  if (odds > 0) return stake * odds / 100;
  return stake * 100 / Math.abs(odds);
}

function calculateTotalReturn(odds: number, stake: number): number {
  return stake + calculateProfit(odds, stake);
}

function toMarketType(type: unknown): "MONEYLINE" | "SPREAD" | "TOTAL" {
  const normalized = String(type ?? "").toUpperCase();
  if (normalized === "SPREAD") return "SPREAD";
  if (normalized === "TOTAL" || normalized === "TOTALS") return "TOTAL";
  return "MONEYLINE";
}

// GET /api/bets - list predictions. Route name is retained for compatibility.
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

    const [predictions, total] = await Promise.all([
      prisma.bet.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
      prisma.bet.count({ where }),
    ]);

    return NextResponse.json({
      predictions,
      bets: predictions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[predictions] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/bets - create a prediction. Route name is retained for compatibility.
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = createPredictionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: formatZodErrors(parsed.error) },
        { status: 400 },
      );
    }

    const { description, odds, stake, predictionType } = parsed.data;

    const profit = calculateProfit(odds, stake);
    const totalReturn = calculateTotalReturn(odds, stake);

    const prediction = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId: user.id } });
      if (!wallet) throw new Error("WALLET_NOT_FOUND");

      const walletUpdate = await tx.wallet.updateMany({
        where: {
          userId: user.id,
          available_vault_balance: { gte: stake },
        },
        data: {
          available_vault_balance: { decrement: stake },
          at_risk_balance: { increment: stake },
          total_wagered: { increment: stake },
        },
      });

      if (walletUpdate.count !== 1) throw new Error("INSUFFICIENT_AVAILABLE");

      const updatedWallet = await tx.wallet.findUniqueOrThrow({ where: { userId: user.id } });

      const createdPrediction = await tx.bet.create({
        data: {
          userId: user.id,
          description: description || "",
          sport: "Other",
          marketType: toMarketType(predictionType),
          selection: description || "",
          odds,
          stake,
          potentialProfit: profit,
          potential_return: totalReturn,
          user_balance_before: wallet.user_balance,
          user_balance_after: wallet.user_balance,
          at_risk_before: wallet.at_risk_balance,
          at_risk_after: updatedWallet.at_risk_balance,
        },
      });

      await tx.transaction.create({
        data: {
          userId: user.id,
          type: STORED_TX_TYPES.predictionCreated,
          amount: stake,
          balanceBefore: wallet.available_vault_balance,
          balanceAfter: updatedWallet.available_vault_balance,
          betId: createdPrediction.id,
          description: description
            ? `Prediction created: ${description} ($${stake.toFixed(2)} at ${odds > 0 ? "+" : ""}${odds})`
            : `Prediction created: $${stake.toFixed(2)} at ${odds > 0 ? "+" : ""}${odds}`,
        },
      });

      return createdPrediction;
    });

    return NextResponse.json({ ...prediction, prediction }, { status: 201 });
  } catch (error) {
    console.error("[predictions] POST error:", error);
    if (error instanceof Error && error.message === "WALLET_NOT_FOUND") {
      return NextResponse.json({ error: "Deposit capital before creating a prediction." }, { status: 404 });
    }
    if (error instanceof Error && error.message === "INSUFFICIENT_AVAILABLE") {
      return NextResponse.json({ error: "Stake exceeds available capital." }, { status: 409 });
    }
    return NextResponse.json({ error: "Prediction could not be created." }, { status: 500 });
  }
}
