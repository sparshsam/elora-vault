import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { STORED_TX_TYPES } from "@/lib/transaction-types";

/**
 * POST /api/onchain/event
 * Log an onchain vault event to the backend database.
 * This is called from the frontend after a successful transaction.
 * The contract is the source of truth for balances; the backend
 * tracks metadata for charts, timelines, and UX.
 *
 * Body: {
 *   type: "ONCHAIN_DEPOSIT" | "ONCHAIN_LOCK_CREATED" | "ONCHAIN_LOCK_RELEASED" | "ONCHAIN_WITHDRAWAL",
 *   amount: number,
 *   txHash: string,
 *   lockId?: number,
 *   unlockAt?: string, // ISO date string
 *   notes?: string,
 * }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, amount, txHash, lockId, unlockAt, notes } =
      await request.json();

    if (!type || !amount || !txHash) {
      return NextResponse.json(
        { error: "type, amount, and txHash are required" },
        { status: 400 },
      );
    }

    const validTypes = [
      "ONCHAIN_DEPOSIT",
      "ONCHAIN_LOCK_CREATED",
      "ONCHAIN_LOCK_RELEASED",
      "ONCHAIN_WITHDRAWAL",
    ];

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 },
      );
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    });

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
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
        const vaultLock = await tx.vaultLock.findFirst({
          where: {
            userId: user.id,
            onchain_lock_id: lockId,
            status: "ACTIVE",
          },
        });

        if (vaultLock) {
          await tx.vaultLock.update({
            where: { id: vaultLock.id },
            data: { status: "UNLOCKED" },
          });
        }
      });
    } else {
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
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
