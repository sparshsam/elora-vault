/**
 * env.ts — Public environment variable accessors (safe for client bundles).
 *
 * All functions here access NEXT_PUBLIC_* variables or have safe defaults.
 * Server-only variables are in ./env-server.ts to prevent bundle leakage.
 *
 * See: https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables
 */

/* ── Helpers ─────────────────────────────────────── */

function assertRequired(key: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(
      `❌ Missing required environment variable: ${key}\n\n` +
        `  ELORA VAULT — ENVIRONMENT ERROR\n\n` +
        `  Variable "${key}" is required but was not set.\n\n` +
        `  To fix this:\n` +
        `    1. Copy .env.example to .env.local\n` +
        `    2. Fill in the value for ${key}\n` +
        `    3. Restart the dev server\n\n` +
        `  See .env.example or README.md for details.\n`,
    );
  }
  return value;
}

function optional(key: string, value: string | undefined, fallback: string): string {
  if (!value || value.trim() === "") return fallback;
  return value.trim();
}

/* ── Public Environment Variables (NEXT_PUBLIC_*) ── */

/** Supabase project URL (public, required for auth & DB) */
export function supabaseUrl(): string {
  return assertRequired("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
}

/** Supabase anon key (public, safe for client bundles) */
export function supabaseAnonKey(): string {
  return assertRequired(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/** WalletConnect Project ID (public, required for RainbowKit) */
export function walletConnectProjectId(): string {
  return assertRequired(
    "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID",
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  );
}

/** Base Mainnet RPC URL (optional, defaults to public endpoint) */
export function baseRpcUrl(): string {
  return optional(
    "NEXT_PUBLIC_BASE_RPC_URL",
    process.env.NEXT_PUBLIC_BASE_RPC_URL,
    "https://mainnet.base.org",
  );
}

/** Base Sepolia RPC URL (optional, defaults to public endpoint) */
export function baseSepoliaRpcUrl(): string {
  return optional(
    "NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL",
    process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL,
    "https://sepolia.base.org",
  );
}

/** Site URL for auth redirects (optional, defaults to localhost) */
export function siteUrl(): string {
  return optional(
    "NEXT_PUBLIC_SITE_URL",
    process.env.NEXT_PUBLIC_SITE_URL,
    "http://localhost:3000",
  );
}

/** Base Builder Code for onchain attribution (optional) */
export function builderCode(): string | undefined {
  const code = process.env.NEXT_PUBLIC_BASE_BUILDER_CODE;
  if (!code || code.trim() === "") return undefined;
  return code.trim();
}
