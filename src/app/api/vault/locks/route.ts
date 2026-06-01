import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { STORED_TX_TYPES } from "@/lib/transaction-types";

// Auto-unlock: find expired ACTIVE locks and release them
async function autoReleaseLocks(userId: string) {
  const expiredLocks = await prisma.vaultLock.findMany({
    where: {
      userId,
      status: "ACTIVE",
      unlockAt: { lte: new Date() },
    },
  });

  for (const lock of expiredLocks) {
    // Get current wallet
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) continue;

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.wallet.update({
        where: { userId },
        data: {
          locked_vault_balance: { decrement: lock.amount },
          available_vault_balance: { increment: lock.amount },
        },
      });

      await tx.vaultLock.update({
        where: { id: lock.id },
        data: { status: "UNLOCKED" },
      });

      await tx.transaction.create({
        data: {
          userId,
          type: STORED_TX_TYPES.protectionReleased,
          amount: lock.amount,
          balanceBefore: wallet.available_vault_balance,
          balanceAfter: wallet.available_vault_balance + lock.amount,
          vaultLockId: lock.id,
          description: `Lock released: $${lock.amount.toFixed(2)} unlocked from protected capital`,
        },
      });
    });
  }

  return expiredLocks.length;
}

// GET /api/vault/locks — returns all locks for user, auto-releases expired
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Auto-release expired locks
    const released = await autoReleaseLocks(user.id);

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    const where: Record<string, unknown> = { userId: user.id };
    if (statusFilter && ["ACTIVE", "UNLOCKED", "CANCELLED"].includes(statusFilter)) {
      where.status = statusFilter;
    }

    const locks = await prisma.vaultLock.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      locks,
      released,
      total: locks.length,
    });
  } catch (error) {
    console.error("Error fetching vault locks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/vault/locks — create a new vault lock
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount, duration, customDate, notes } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 },
      );
    }

    // Determine unlock date
    let unlockAt: Date;
    if (customDate) {
      unlockAt = new Date(customDate);
      if (isNaN(unlockAt.getTime()) || unlockAt <= new Date()) {
        return NextResponse.json(
          { error: "Custom unlock date must be in the future" },
          { status: 400 },
        );
      }
    } else if (duration) {
      unlockAt = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
    } else {
      return NextResponse.json(
        { error: "Duration or custom date is required" },
        { status: 400 },
      );
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    });

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    if (amount > wallet.available_vault_balance) {
      return NextResponse.json(
        {
          error: `Amount ($${amount.toFixed(2)}) exceeds available vault capital ($${wallet.available_vault_balance.toFixed(2)})`,
        },
        { status: 400 },
      );
    }

    // Create lock and update wallet in a transaction
    const vaultLock = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const lock = await tx.vaultLock.create({
        data: {
          userId: user.id,
          amount,
          unlockAt,
          status: "ACTIVE",
          notes: notes || null,
        },
      });

      await tx.wallet.update({
        where: { userId: user.id },
        data: {
          locked_vault_balance: { increment: amount },
          available_vault_balance: { decrement: amount },
        },
      });

      const durationDisplay = customDate
        ? `until ${unlockAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
        : `for ${duration} days`;

      await tx.transaction.create({
        data: {
          userId: user.id,
          type: STORED_TX_TYPES.protectionCreated,
          amount,
          balanceBefore: wallet.available_vault_balance,
          balanceAfter: wallet.available_vault_balance - amount,
          vaultLockId: lock.id,
          description: `$${amount.toFixed(2)} protected ${durationDisplay}`,
        },
      });

      return lock;
    });

    return NextResponse.json({ lock: vaultLock }, { status: 201 });
  } catch (error) {
    console.error("Error creating vault lock:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
