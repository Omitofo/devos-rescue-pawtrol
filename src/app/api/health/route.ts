import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * Health endpoint — WP-01 / NFR-10 (basic observability).
 *
 * Returns a simple JSON payload confirming the process is alive.
 * Later work packages (WP-17) may extend this with dependency checks
 * (Supabase connectivity, queue depth, etc.) while keeping the same path.
 *
 * Intentionally unauthenticated and public — suitable for uptime monitors.
 */
export async function GET() {
  const started = Date.now();

  // Structured log so operators can correlate health probes with other events.
  logger.info("health.check", {
    path: "/api/health",
    method: "GET",
  });

  return NextResponse.json(
    {
      status: "ok",
      service: "rescue-pawtrol",
      timestamp: new Date().toISOString(),
      uptimeMs: Math.round(process.uptime() * 1000),
      // Latency of this handler itself (useful for basic SLI).
      latencyMs: Date.now() - started,
    },
    {
      status: 200,
      headers: {
        // Discourage caching of health responses.
        "Cache-Control": "no-store",
      },
    }
  );
}
