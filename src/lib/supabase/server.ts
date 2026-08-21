/**
 * Server Supabase clients — WP-01.
 *
 * Two flavours:
 * 1. createClient()      — respects the user session (cookies). Use for
 *                          almost all Server Components, Server Actions,
 *                          and Route Handlers that act on behalf of a user.
 * 2. createServiceClient() — uses the service-role key. Bypasses RLS.
 *                            ONLY for trusted server contexts that need
 *                            elevated access (admin provisioning, background
 *                            jobs, etc.). Never expose this client to the browser.
 *
 * NFR-02 is enforced by keeping the service-role key out of any NEXT_PUBLIC_*
 * variable and out of any module that can be imported by Client Components.
 */

import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Cookie-aware server client (anon key + user JWT when present).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — middleware or a Route Handler
            // will refresh the session. Safe to ignore here.
          }
        },
      },
    }
  );
}

/**
 * Service-role client — elevated privileges, no user session.
 * Use only in Route Handlers / Server Actions / Edge Functions that
 * have already performed their own authorization checks.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
        "Service client cannot be created."
    );
  }

  return createSupabaseClient(url, key, {
    auth: {
      // Service role does not need session persistence.
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
