import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId: user.id },
      });
    }

    return NextResponse.json(wallet);
  } catch (error) {
    console.error("Error fetching wallet:", error);
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

    const { amount } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 },
      );
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    });

    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet not found. Create a wallet first." },
        { status: 404 },
      );
    }

    const updatedWallet = await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        totalBalance: { increment: amount },
        houseBalance: { increment: amount },
      },
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "DEPOSIT",
        amount,
        balanceBefore: wallet.totalBalance,
        balanceAfter: updatedWallet.totalBalance,
        description: `Deposit of $${amount.toFixed(2)}`,
      },
    });

    return NextResponse.json(updatedWallet);
  } catch (error) {
    console.error("Error depositing:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
