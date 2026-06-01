import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getAddress } from "viem";
import { connectWalletSchema, formatZodErrors } from "@/lib/validation";

/**
 * POST /api/wallet/connect
 * Register or update the user's connected Base wallet address.
 * Validates the address format using viem's getAddress.
 *
 * Body: { walletAddress: string }
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

    const body = await request.json();
    const parsed = connectWalletSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: formatZodErrors(parsed.error) },
        { status: 400 },
      );
    }
    const { walletAddress } = parsed.data;

    // Validate and checksum the address
    let checksummedAddress: `0x${string}`;
    try {
      checksummedAddress = getAddress(walletAddress);
    } catch {
      return NextResponse.json(
        { error: "Invalid wallet address" },
        { status: 400 },
      );
    }

    // Upsert wallet with the connected address
    const wallet = await prisma.wallet.upsert({
      where: { userId: user.id },
      update: {
        wallet_address: checksummedAddress,
      },
      create: {
        userId: user.id,
        wallet_address: checksummedAddress,
        virtual_house_balance: 1000000000,
      },
    });

    return NextResponse.json({
      success: true,
      walletAddress: checksummedAddress,
      wallet,
    });
  } catch (error) {
    console.error("Error connecting wallet:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/wallet/connect
 * Disconnect the wallet (remove the address, keep the wallet).
 */
export async function DELETE() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.wallet.update({
      where: { userId: user.id },
      data: { wallet_address: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error disconnecting wallet:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
