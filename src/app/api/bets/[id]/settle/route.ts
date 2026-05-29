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
      newUserBalance: number;
      newSavingsVault: number;
      withdrawableWinnings: number;
    };
    let transactionType: string;
    let description: string;
    let transactionAmount: number;

    if (result === "WIN") {
      settlement = settleWin(
        wallet.virtual_house_balance,
        wallet.user_balance,
        wallet.savings_vault,
        bet.stake,
        bet.potentialProfit,
      );
      transactionType = "WIN_PROFIT";
      transactionAmount = bet.stake + bet.potentialProfit;
      description = `Bet won: ${bet.sport} - ${bet.selection} (${bet.odds > 0 ? "+" : ""}${bet.odds})`;
    } else if (result === "LOSS") {
      settlement = settleLoss(
        wallet.virtual_house_balance,
        wallet.user_balance,
        wallet.savings_vault,
        bet.stake,
      );
      transactionType = "LOSS_TO_SAVINGS";
      transactionAmount = bet.stake;
      description = `Bet lost: ${bet.sport} - ${bet.selection} — $${bet.stake.toFixed(2)} saved to vault`;
    } else {
      settlement = settlePush(
        wallet.virtual_house_balance,
        wallet.user_balance,
        wallet.savings_vault,
        bet.stake,
      );
      transactionType = "PUSH_RETURN";
      transactionAmount = bet.stake;
      description = `Bet push: ${bet.sport} - ${bet.selection} (stake returned)`;
    }

    const updatedWallet = await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        virtual_house_balance: settlement.newHouseBalance,
        user_balance: settlement.newUserBalance,
        savings_vault: settlement.newSavingsVault,
        withdrawable_winnings: result === "WIN"
          ? { increment: settlement.withdrawableWinnings }
          : result === "LOSS"
            ? settlement.withdrawableWinnings
            : settlement.withdrawableWinnings,
        total_saved_from_losses: result === "LOSS"
          ? { increment: bet.stake }
          : undefined,
        total_profit_won: result === "WIN"
          ? { increment: bet.potentialProfit }
          : undefined,
      },
    });

    await prisma.bet.update({
      where: { id },
      data: {
        status: result as "WON" | "LOST" | "PUSH",
        settledAt: new Date(),
        house_balance_after: settlement.newHouseBalance,
        user_balance_after: settlement.newUserBalance,
        savings_vault_after: settlement.newSavingsVault,
      },
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: transactionType as
          | "WIN_PROFIT"
          | "LOSS_TO_SAVINGS"
          | "PUSH_RETURN",
        amount: transactionAmount,
        balanceBefore: wallet.user_balance,
        balanceAfter: settlement.newUserBalance,
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
