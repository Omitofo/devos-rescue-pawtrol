/**
 * Supabase session helper for the Next.js proxy — WP-01 (partial).
 *
 * Renamed from middleware.ts helper to match the Next.js 16 “proxy”
 * convention. Behaviour is identical: refresh the Auth token if expired
 * and write the updated cookies back to the response so Server Components
 * stay in sync.
 *
 * Used by src/proxy.ts. Route-level auth guards arrive in WP-03.
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Shape of cookies passed to setAll by @supabase/ssr */
type CookieToSet = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake can make sessions unstable.
  await supabase.auth.getUser();

  return supabaseResponse;
}
