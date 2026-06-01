import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { STORED_TX_TYPES } from "@/lib/transaction-types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { result } = await request.json();

    if (!["WIN", "LOSS", "PUSH"].includes(result)) {
      return NextResponse.json({ error: "Result must be WIN, LOSS, or PUSH" }, { status: 400 });
    }

    const prediction = await prisma.bet.findUnique({ where: { id } });
    if (!prediction) return NextResponse.json({ error: "Prediction not found" }, { status: 404 });
    if (prediction.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (prediction.status !== "OPEN") return NextResponse.json({ error: "Prediction is already settled" }, { status: 400 });

    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
    if (!wallet) return NextResponse.json({ error: "Wallet not found" }, { status: 404 });

    let newAvailableBalance = wallet.available_vault_balance;
    const newCommitted = wallet.at_risk_balance - prediction.stake;
    let transactionAmount = 0;
    let transactionType: typeof STORED_TX_TYPES[keyof typeof STORED_TX_TYPES] = STORED_TX_TYPES.predictionLost;
    let description: string;
    const status = result === "WIN" ? "WON" : result === "LOSS" ? "LOST" : "PUSH";

    if (result === "WIN") {
      const totalReturn = prediction.stake + prediction.potentialProfit;
      newAvailableBalance += totalReturn;
      transactionAmount = totalReturn;
      transactionType = STORED_TX_TYPES.predictionWon;
      description = prediction.description
        ? `Prediction won: ${prediction.description} - +$${prediction.potentialProfit.toFixed(2)}`
        : `Prediction won: +$${prediction.potentialProfit.toFixed(2)}`;
    } else if (result === "LOSS") {
      transactionAmount = prediction.stake;
      description = prediction.description
        ? `Prediction lost: ${prediction.description}`
        : "Prediction lost";
    } else {
      newAvailableBalance += prediction.stake;
      transactionAmount = prediction.stake;
      transactionType = STORED_TX_TYPES.predictionPushed;
      description = prediction.description
        ? `Prediction pushed: ${prediction.description} - stake returned`
        : "Prediction pushed: stake returned";
    }

    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        available_vault_balance: newAvailableBalance,
        at_risk_balance: Math.max(0, newCommitted),
        ...(result === "LOSS" ? { total_saved_from_losses: { increment: prediction.stake } } : {}),
        ...(result === "WIN" ? { total_profit_won: { increment: prediction.potentialProfit } } : {}),
      },
    });

    const updatedPrediction = await prisma.bet.update({
      where: { id },
      data: {
        status,
        settledAt: new Date(),
        user_balance_after: wallet.user_balance,
        at_risk_before: wallet.at_risk_balance,
        at_risk_after: Math.max(0, newCommitted),
      },
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: transactionType,
        amount: transactionAmount,
        balanceBefore: wallet.available_vault_balance,
        balanceAfter: newAvailableBalance,
        betId: prediction.id,
        description,
      },
    });

    return NextResponse.json({ prediction: updatedPrediction, bet: updatedPrediction });
  } catch (error) {
    console.error("[settle] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
