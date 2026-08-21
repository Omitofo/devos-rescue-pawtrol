/**
 * Root middleware — WP-01 skeleton.
 *
 * Currently only refreshes the Supabase session so that Server Components
 * always see a fresh JWT. Route protection, elevated-reauth window checks,
 * and locale detection will be added in WP-03 / WP-16.
 *
 * Matcher deliberately excludes static assets and the health endpoint
 * so probes stay cheap.
 */

import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico, sitemap, robots
     * - api/health (keep health checks free of session work)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/health).*)",
  ],
};
