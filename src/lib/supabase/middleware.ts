/**
 * Supabase session helper for Next.js middleware — WP-01 (partial).
 *
 * This utility will be used by the root middleware once authentication
 * routes exist (WP-03). For now it is provided so the foundation already
 * contains the correct pattern and no rewrite is needed later.
 *
 * It refreshes the Auth token if expired and writes the updated cookies
 * back to the response, keeping Server Components in sync.
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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
        setAll(cookiesToSet) {
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
