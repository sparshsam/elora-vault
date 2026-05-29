import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { settleWin, settleLoss, settlePush } from "@/lib/liability";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { result } = await request.json();

    if (!["WIN", "LOSS", "PUSH"].includes(result)) {
      return NextResponse.json(
        { error: "Result must be WIN, LOSS, or PUSH" },
        { status: 400 },
      );
    }

    const bet = await prisma.bet.findUnique({
      where: { id },
    });

    if (!bet) {
      return NextResponse.json({ error: "Bet not found" }, { status: 404 });
    }

    if (bet.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (bet.status !== "OPEN") {
      return NextResponse.json(
        { error: "Bet is already settled" },
        { status: 400 },
      );
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    });

    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet not found" },
        { status: 404 },
      );
    }

    // Perform settlement calculations
    let settlement: {
      newHouseBalance: number;
      withdrawableProfit: number;
      amountSaved: number;
    };
    let transactionType: string;
    let description: string;

    if (result === "WIN") {
      settlement = settleWin(wallet.houseBalance, bet.stake, bet.potentialProfit);
      transactionType = "WIN_PROFIT";
      description = `Bet won: ${bet.sport} - ${bet.selection} (${bet.odds > 0 ? "+" : ""}${bet.odds})`;
    } else if (result === "LOSS") {
      settlement = settleLoss(wallet.houseBalance, bet.stake);
      transactionType = "LOSS_ABSORBED";
      description = `Bet lost: ${bet.sport} - ${bet.selection} ($${bet.stake.toFixed(2)} absorbed)`;
    } else {
      settlement = settlePush(wallet.houseBalance);
      transactionType = "PUSH";
      description = `Bet push: ${bet.sport} - ${bet.selection} (stake returned)`;
    }

    const updatedWallet = await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        houseBalance: settlement.newHouseBalance,
        withdrawableProfit: {
          increment: settlement.withdrawableProfit,
        },
        totalSavedFromLosses: {
          increment: settlement.amountSaved,
        },
      },
    });

    await prisma.bet.update({
      where: { id },
      data: {
        status: result as "WON" | "LOST" | "PUSH",
        settledAt: new Date(),
        houseBalanceAfter: settlement.newHouseBalance,
      },
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: transactionType as
          | "WIN_PROFIT"
          | "LOSS_ABSORBED"
          | "PUSH",
        amount: result === "WIN" ? bet.stake + bet.potentialProfit : bet.stake,
        balanceBefore: wallet.totalBalance,
        balanceAfter: updatedWallet.totalBalance,
        betId: bet.id,
        description,
      },
    });

    return NextResponse.json({
      bet: { ...bet, status: result },
      wallet: updatedWallet,
    });
  } catch (error) {
    console.error("Error settling bet:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
