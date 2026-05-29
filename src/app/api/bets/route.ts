import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { calculateProfit, calculateTotalReturn, validateBet } from "@/lib/liability";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId: user.id };
    if (status && ["OPEN", "WON", "LOST", "PUSH"].includes(status)) {
      where.status = status;
    }

    const [bets, total] = await Promise.all([
      prisma.bet.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.bet.count({ where }),
    ]);

    return NextResponse.json({
      bets,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching bets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sport, league, event_name, marketType, selection, odds, stake } = body;

    if (!sport || !marketType || !selection || !odds || !stake) {
      return NextResponse.json(
        { error: "Missing required fields: sport, marketType, selection, odds, stake" },
        { status: 400 },
      );
    }

    if (!["MONEYLINE", "SPREAD", "TOTAL"].includes(marketType)) {
      return NextResponse.json(
        { error: "Invalid market type" },
        { status: 400 },
      );
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    });

    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet not found. Deposit funds first." },
        { status: 404 },
      );
    }

    // Validate stake against user_balance only (no house liability cap)
    const validation = validateBet(odds, stake, wallet.user_balance);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.reason, profit: validation.profit, totalReturn: validation.totalReturn },
        { status: 400 },
      );
    }

    const profit = calculateProfit(odds, stake);
    const totalReturn = calculateTotalReturn(odds, stake);

    // Deduct stake from user balance
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        user_balance: { decrement: stake },
        total_wagered: { increment: stake },
      },
    });

    const updatedWallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    });

    const bet = await prisma.bet.create({
      data: {
        userId: user.id,
        sport,
        league: league || null,
        event_name: event_name || null,
        marketType,
        selection,
        odds,
        stake,
        potentialProfit: profit,
        potential_return: totalReturn,
        user_balance_before: wallet.user_balance,
        user_balance_after: updatedWallet?.user_balance ?? wallet.user_balance - stake,
        house_balance_before: wallet.virtual_house_balance,
        house_balance_after: wallet.virtual_house_balance,
        savings_vault_before: wallet.savings_vault,
        savings_vault_after: wallet.savings_vault,
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
        description: `Bet placed: ${sport}${league ? " " + league : ""} ${marketType} - ${selection} ($${stake.toFixed(2)} at ${odds > 0 ? "+" : ""}${odds})`,
      },
    });

    return NextResponse.json(bet, { status: 201 });
  } catch (error) {
    console.error("Error creating bet:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
