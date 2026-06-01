/**
 * Elora Vault — Validation Schemas (Zod)
 *
 * Centralized request validation for all API routes.
 * Ensures consistent type checking, malformed input rejection,
 * and clear error messages.
 */
import { z } from "zod";

/* ── Shared Primitives ───────────────────────────────── */

const oddsSchema = z
  .number()
  .int("Odds must be a whole number (American odds format)")
  .min(-99999, "Odds must be between -99999 and +99999")
  .max(99999, "Odds must be between -99999 and +99999")
  .refine((val) => val !== 0, { message: "Odds cannot be zero" });

const stakeSchema = z
  .number()
  .positive("Stake must be greater than 0")
  .max(100000, "Stake exceeds maximum (100,000)")
  .finite("Stake must be a finite number");

const amountSchema = z
  .number()
  .positive("Amount must be greater than 0")
  .max(10000000, "Amount exceeds maximum")
  .finite("Amount must be a finite number");

const descriptionSchema = z
  .string()
  .max(500, "Description must be 500 characters or fewer")
  .optional()
  .default("");

const txHashSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash format")
  .optional();

const durationDaysSchema = z
  .number()
  .int("Duration must be a whole number of days")
  .positive("Duration must be greater than 0")
  .max(3650, "Duration cannot exceed 3650 days (10 years)");

/* ── API Schemas ─────────────────────────────────────── */

/**
 * POST /api/bets — Create a prediction
 */
export const createPredictionSchema = z.object({
  description: descriptionSchema,
  odds: oddsSchema,
  stake: stakeSchema,
  predictionType: z
    .enum(["MONEYLINE", "SPREAD", "TOTAL"])
    .optional()
    .default("MONEYLINE"),
  betType: z
    .enum(["MONEYLINE", "SPREAD", "TOTAL"])
    .optional(),
});

/**
 * PATCH /api/bets/[id]/settle — Settle a prediction
 */
export const settlePredictionSchema = z.object({
  result: z.enum(["WIN", "LOSS", "PUSH"], {
    error: "Result must be WIN, LOSS, or PUSH",
  }),
});

/**
 * PATCH /api/bets/[id]/protect — Protect profit after settlement
 */
export const protectProfitSchema = z.object({
  amount: amountSchema,
  durationDays: durationDaysSchema,
  txHash: txHashSchema,
});

/**
 * POST /api/wallet — Deposit (virtual)
 */
export const depositSchema = z.object({
  amount: amountSchema,
});

/**
 * POST /api/wallet/connect — Register wallet address
 */
export const connectWalletSchema = z.object({
  walletAddress: z
    .string()
    .min(1, "walletAddress is required")
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format"),
});

/**
 * POST /api/onchain/event — Log onchain event
 */
export const onchainEventSchema = z.object({
  type: z.enum(
    [
      "ONCHAIN_DEPOSIT",
      "ONCHAIN_LOCK_CREATED",
      "ONCHAIN_LOCK_RELEASED",
      "ONCHAIN_WITHDRAWAL",
    ] as const,
    {
      error:
        "Type must be one of: ONCHAIN_DEPOSIT, ONCHAIN_LOCK_CREATED, ONCHAIN_LOCK_RELEASED, ONCHAIN_WITHDRAWAL",
    },
  ),
  amount: amountSchema,
  txHash: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash format"),
  lockId: z.number().int().optional(),
  unlockAt: z.string().datetime().optional(),
  notes: z.string().max(1000).optional(),
});

/**
 * POST /api/vault/locks — Create a vault lock (offchain)
 */
export const createVaultLockSchema = z.object({
  amount: amountSchema,
  duration: durationDaysSchema.optional(),
  customDate: z.string().datetime().optional(),
  notes: z.string().max(1000).optional(),
}).refine(
  (data) => data.duration || data.customDate,
  { message: "Duration or custom date is required" },
);

/* ── Query Param Schemas ─────────────────────────────── */

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
  status: z.string().optional(),
});

/* ── Utility ─────────────────────────────────────────── */

/**
 * Parse Zod errors into a flat string array.
 */
export function formatZodErrors(
  error: z.ZodError,
): { field: string; message: string }[] {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}
