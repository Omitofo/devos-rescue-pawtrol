/**
 * Root proxy — WP-01 skeleton (Next.js 16 convention).
 *
 * Formerly middleware.ts. Next.js 16 renamed the file convention to “proxy”
 * to clarify its role as a thin network boundary (rewrites, redirects,
 * header/cookie handling). Heavy auth logic stays out of here; the proxy
 * only keeps the Supabase session fresh so Server Components see a current JWT.
 *
 * Route protection, elevated-reauth window checks, and locale detection
 * will be added in WP-03 / WP-16.
 *
 * Matcher deliberately excludes static assets and the health endpoint
 * so probes stay cheap.
 */

import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
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
