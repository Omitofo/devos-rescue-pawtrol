/**
 * Root proxy — Next.js 16 convention (WP-01 + WP-03).
 *
 * Thin network boundary: refreshes the Supabase session so Server Components
 * always see a current JWT. Heavy auth logic (role checks, elevated window)
 * lives in Server Components / Server Actions via @/lib/auth — not here.
 *
 * Matcher excludes static assets and the health endpoint.
 */

import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/health).*)",
  ],
};
