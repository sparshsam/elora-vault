import { createBrowserClient } from "@supabase/ssr";
import { supabaseUrl, supabaseAnonKey } from "@/lib/env";

let client: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Get or create the browser Supabase client.
 *
 * Created lazily so it doesn't crash during Next.js static prerendering
 * when env vars aren't available. Call this once at module init is safe
 * because the env validation will throw with a clear message if missing.
 * For auth pages, call it inside event handlers or useEffect instead.
 */
export function createClient() {
  if (!client) {
    client = createBrowserClient(supabaseUrl(), supabaseAnonKey());
  }
  return client;
}
