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
    const { amount, durationDays } = await request.json();

    if (!amount || !durationDays) {
      return NextResponse.json({ error: "Missing amount or durationDays" }, { status: 400 });
    }

    const bet = await prisma.bet.findUnique({ where: { id } });
    if (!bet) return NextResponse.json({ error: "Bet not found" }, { status: 404 });
    if (bet.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
    if (!wallet) return NextResponse.json({ error: "Wallet not found" }, { status: 404 });

    // Create a vault lock record in the database (tracks offchain)
    const unlockAt = new Date(Date.now() + durationDays * 86400000);
    const vaultLock = await prisma.vaultLock.create({
      data: {
        userId: user.id,
        amount,
        unlockAt,
        status: "ACTIVE",
        notes: `Protected after bet: ${bet.description || "Bet"}`,
      },
    });

    // Update the bet with horizon link
    await prisma.bet.update({
      where: { id },
      data: {
        description: `${bet.description || "Bet"} — protected ${amount > bet.potentialProfit ? "full return" : "profit"} for ${durationDays}d`,
        potential_return: amount, // update to amount protected
      },
    });

    // Create activity transaction
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "LOCK_CREATED",
        amount,
        balanceBefore: wallet.user_balance,
        balanceAfter: wallet.user_balance,
        betId: bet.id,
        vaultLockId: vaultLock.id,
        description: `Profit protected after bet${bet.description ? ": " + bet.description : "."}`,
      },
    });

    return NextResponse.json({
      success: true,
      lockId: vaultLock.id,
      unlockAt: unlockAt.toISOString(),
    });
  } catch (error) {
    console.error("[protect] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
