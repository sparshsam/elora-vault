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
    const { amount, durationDays } = await request.json();

    if (!amount || !durationDays) {
      return NextResponse.json({ error: "Missing amount or durationDays" }, { status: 400 });
    }

    const prediction = await prisma.bet.findUnique({ where: { id } });
    if (!prediction) return NextResponse.json({ error: "Prediction not found" }, { status: 404 });
    if (prediction.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
    if (!wallet) return NextResponse.json({ error: "Wallet not found" }, { status: 404 });

    if (amount > wallet.available_vault_balance) {
      return NextResponse.json({ error: "Amount exceeds available capital" }, { status: 400 });
    }

    const unlockAt = new Date(Date.now() + durationDays * 86400000);

    const vaultLock = await prisma.$transaction(async (tx) => {
      const lock = await tx.vaultLock.create({
        data: {
          userId: user.id,
          amount,
          unlockAt,
          status: "ACTIVE",
          notes: `Protected after prediction: ${prediction.description || "Prediction"}`,
        },
      });

      await tx.wallet.update({
        where: { userId: user.id },
        data: {
          available_vault_balance: { decrement: amount },
          locked_vault_balance: { increment: amount },
        },
      });

      await tx.bet.update({
        where: { id },
        data: {
          description: `${prediction.description || "Prediction"} - protected ${amount > prediction.potentialProfit ? "full return" : "profit"} for ${durationDays}d`,
          potential_return: amount,
        },
      });

      await tx.transaction.create({
        data: {
          userId: user.id,
          type: STORED_TX_TYPES.protectionCreated,
          amount,
          balanceBefore: wallet.available_vault_balance,
          balanceAfter: wallet.available_vault_balance - amount,
          betId: prediction.id,
          vaultLockId: lock.id,
          description: `Return protected after prediction${prediction.description ? ": " + prediction.description : "."}`,
        },
      });

      return lock;
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
