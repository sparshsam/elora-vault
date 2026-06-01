import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { STORED_TX_TYPES } from "@/lib/transaction-types";
import { onchainEventSchema, formatZodErrors } from "@/lib/validation";

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
    const parsed = onchainEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: formatZodErrors(parsed.error) },
        { status: 400 },
      );
    }

    const { type, amount, txHash, lockId, unlockAt, notes } = parsed.data;

    const existingTransaction = await prisma.transaction.findFirst({
      where: { userId: user.id, tx_hash: txHash },
      select: { id: true },
    });

    if (existingTransaction) {
      return NextResponse.json({ success: true, duplicate: true });
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    });

    if (!wallet) {
      return NextResponse.json({ error: "Capital state could not be updated." }, { status: 404 });
    }

    let description = "";

    switch (type) {
      case "ONCHAIN_DEPOSIT":
        description = `$${amount.toFixed(2)} deposited to Elora capital`;
        break;
      case "ONCHAIN_LOCK_CREATED":
        description = `$${amount.toFixed(2)} protected${unlockAt ? ` until ${new Date(unlockAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : ""}`;
        break;
      case "ONCHAIN_LOCK_RELEASED":
        description = `$${amount.toFixed(2)} protection released`;
        break;
      case "ONCHAIN_WITHDRAWAL":
        description = `$${amount.toFixed(2)} withdrawn from Elora capital`;
        break;
    }

    if (type === "ONCHAIN_DEPOSIT") {
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const updatedWallet = await tx.wallet.update({
          where: { userId: user.id },
          data: {
            available_vault_balance: { increment: amount },
            total_deposited: { increment: amount },
          },
        });

        await tx.transaction.create({
          data: {
            userId: user.id,
            type: STORED_TX_TYPES.depositCompleted,
            amount,
            balanceBefore: wallet.available_vault_balance,
            balanceAfter: updatedWallet.available_vault_balance,
            description,
            tx_hash: txHash,
          },
        });
      });
    } else if (type === "ONCHAIN_LOCK_CREATED" && unlockAt) {
      if (amount > wallet.available_vault_balance) {
        return NextResponse.json(
          { error: "Protection was confirmed, but available capital is out of sync. Please refresh." },
          { status: 409 },
        );
      }

      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const updatedWallet = await tx.wallet.update({
          where: { userId: user.id },
          data: {
            available_vault_balance: { decrement: amount },
            locked_vault_balance: { increment: amount },
          },
        });

        await tx.transaction.create({
          data: {
            userId: user.id,
            type: STORED_TX_TYPES.protectionCreated,
            amount,
            balanceBefore: wallet.available_vault_balance,
            balanceAfter: updatedWallet.available_vault_balance,
            description,
            tx_hash: txHash,
          },
        });

        // Create vault lock
        await tx.vaultLock.create({
          data: {
            userId: user.id,
            amount,
            unlockAt: new Date(unlockAt),
            status: "ACTIVE",
            onchain_lock_id: lockId,
            tx_hash: txHash,
            notes: notes || null,
          },
        });
      });
    } else if (type === "ONCHAIN_LOCK_RELEASED" && lockId !== undefined) {
      const activeLock = await prisma.vaultLock.findFirst({
        where: {
          userId: user.id,
          onchain_lock_id: lockId,
          status: "ACTIVE",
        },
      });

      if (!activeLock) {
        return NextResponse.json({ error: "Capital release is already reflected." }, { status: 409 });
      }

      // Find the vault lock by onchain_lock_id and mark as unlocked
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const updatedWallet = await tx.wallet.update({
          where: { userId: user.id },
          data: {
            locked_vault_balance: { decrement: amount },
            available_vault_balance: { increment: amount },
          },
        });

        await tx.transaction.create({
          data: {
            userId: user.id,
            type: STORED_TX_TYPES.protectionReleased,
            amount,
            balanceBefore: wallet.available_vault_balance,
            balanceAfter: updatedWallet.available_vault_balance,
            description,
            tx_hash: txHash,
          },
        });

        // Mark the lock as unlocked
        await tx.vaultLock.update({
          where: { id: activeLock.id },
          data: { status: "UNLOCKED" },
        });
      });
    } else {
      if (amount > wallet.available_vault_balance) {
        return NextResponse.json(
          { error: "Withdrawal was confirmed, but available capital is out of sync. Please refresh." },
          { status: 409 },
        );
      }

      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const updatedWallet = await tx.wallet.update({
          where: { userId: user.id },
          data: {
            available_vault_balance: { decrement: amount },
          },
        });

        await tx.transaction.create({
          data: {
            userId: user.id,
            type: STORED_TX_TYPES.withdrawalCompleted,
            amount,
            balanceBefore: wallet.available_vault_balance,
            balanceAfter: updatedWallet.available_vault_balance,
            description,
            tx_hash: txHash,
          },
        });
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error logging onchain event:", error);
    return NextResponse.json(
      { error: "Capital state could not be updated." },
      { status: 500 },
    );
  }
}
