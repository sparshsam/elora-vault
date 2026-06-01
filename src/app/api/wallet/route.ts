import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { STORED_TX_TYPES } from "@/lib/transaction-types";
import { depositSchema, formatZodErrors } from "@/lib/validation";

/**
 * Ensure the Prisma User record exists for the given Supabase user.
 * Called on every wallet request so new users don't get FK errors.
 */
async function ensureUser(supabaseUser: { id: string; email?: string | null }) {
  try {
    await prisma.user.upsert({
      where: { id: supabaseUser.id },
      update: {},
      create: {
        id: supabaseUser.id,
        email: supabaseUser.email ?? `user-${supabaseUser.id.slice(0, 8)}@placeholder.elora`,
      },
    });
  } catch {
    // Silently handled — wallet creation will fail gracefully if this does.
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure Prisma User record exists before wallet query
    await ensureUser(user);

    let wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: user.id,
          virtual_house_balance: 1000000000,
        },
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

    // Ensure Prisma User record exists before wallet operations
    await ensureUser(user);

    const body = await request.json();
    const parsed = depositSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: formatZodErrors(parsed.error) },
        { status: 400 },
      );
    }
    const { amount } = parsed.data;

    let wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: user.id,
          virtual_house_balance: 1000000000,
        },
      });
    }

    // Deposit moves external wallet funds into Elora available capital.
    const updatedWallet = await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        available_vault_balance: { increment: amount },
        total_deposited: { increment: amount },
      },
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: STORED_TX_TYPES.depositCompleted,
        amount,
        balanceBefore: wallet.available_vault_balance,
        balanceAfter: updatedWallet.available_vault_balance,
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
