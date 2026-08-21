/**
 * Browser Supabase client — WP-01.
 *
 * Uses the public anon key only (NFR-02).
 * Safe to import from Client Components.
 *
 * Creates a singleton so we do not open multiple GoTrue clients
 * in the same browser tab.
 *
 * Later (WP-03) this client will participate in the elevated re-auth
 * window for organization mutations; the surface stays the same.
 */

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
