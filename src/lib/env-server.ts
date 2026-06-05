/**
 * env-server.ts — Server-only environment variable accessors.
 *
 * These functions access non-NEXT_PUBLIC variables and MUST only be
 * imported by server-side code (API routes, middleware, server components).
 * Importing these in client bundles will leak secrets or fail at runtime.
 */

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

/** Supabase service-role key (server-only, NEVER expose in client bundles) */
export function supabaseServiceRoleKey(): string {
  return assertRequired(
    "SUPABASE_SERVICE_ROLE_KEY",
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

/** Database connection URL via PgBouncer pooler (server-only) */
export function databaseUrl(): string {
  return assertRequired("DATABASE_URL", process.env.DATABASE_URL);
}

/** Direct database connection URL (server-only, for migrations) */
export function directUrl(): string {
  return assertRequired("DIRECT_URL", process.env.DIRECT_URL);
}
