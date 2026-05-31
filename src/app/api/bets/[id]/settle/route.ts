import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

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

    const bet = await prisma.bet.findUnique({ where: { id } });
    if (!bet) return NextResponse.json({ error: "Bet not found" }, { status: 404 });
    if (bet.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (bet.status !== "OPEN") return NextResponse.json({ error: "Bet is already settled" }, { status: 400 });

    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
    if (!wallet) return NextResponse.json({ error: "Wallet not found" }, { status: 404 });

    let newAvailableBalance = wallet.available_vault_balance;
    const newAtRisk = wallet.at_risk_balance - bet.stake;
    let transactionAmount = 0;
    let transactionType: string;
    let description: string;
    const status = result === "WIN" ? "WON" : result === "LOSS" ? "LOST" : "PUSH";

    if (result === "WIN") {
      const totalReturn = bet.stake + bet.potentialProfit;
      newAvailableBalance += totalReturn;
      transactionAmount = totalReturn;
      transactionType = "WIN_PROFIT";
      description = bet.description
        ? `Bet won: ${bet.description} — +$${bet.potentialProfit.toFixed(2)}`
        : `Bet won: +$${bet.potentialProfit.toFixed(2)}`;
    } else if (result === "LOSS") {
      transactionAmount = bet.stake;
      transactionType = "LOSS_TO_SAVINGS";
      description = bet.description
        ? `Bet lost: ${bet.description}`
        : "Bet lost";
    } else {
      // PUSH — return stake
      newAvailableBalance += bet.stake;
      transactionAmount = bet.stake;
      transactionType = "PUSH_RETURN";
      description = bet.description
        ? `Bet pushed: ${bet.description} — stake returned`
        : "Bet pushed: stake returned";
    }

    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        available_vault_balance: newAvailableBalance,
        at_risk_balance: Math.max(0, newAtRisk),
        ...(result === "LOSS" ? { total_saved_from_losses: { increment: bet.stake } } : {}),
        ...(result === "WIN" ? { total_profit_won: { increment: bet.potentialProfit } } : {}),
      },
    });

    const updatedBet = await prisma.bet.update({
      where: { id },
      data: {
        status,
        settledAt: new Date(),
        user_balance_after: wallet.user_balance,
        at_risk_before: wallet.at_risk_balance,
        at_risk_after: Math.max(0, newAtRisk),
      },
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: transactionType as "WIN_PROFIT" | "LOSS_TO_SAVINGS" | "PUSH_RETURN",
        amount: transactionAmount,
        balanceBefore: wallet.available_vault_balance,
        balanceAfter: newAvailableBalance,
        betId: bet.id,
        description,
      },
    });

    return NextResponse.json({ bet: updatedBet });
  } catch (error) {
    console.error("[settle] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
