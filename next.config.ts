import type { NextConfig } from "next";

/**
 * Next.js configuration for Rescue Pawtrol.
 *
 * WP-01 foundation: minimal, production-oriented defaults.
 * - App Router is the default (no pages/ directory).
 * - Images from Supabase Storage will be added later (WP-04 / WP-05).
 * - No experimental flags until required by a later work package.
 */
const nextConfig: NextConfig = {
  // Strict mode helps catch side-effects early.
  reactStrictMode: true,

  // Powered-by header is unnecessary and slightly leaks stack info.
  poweredByHeader: false,

  // Future: add remotePatterns for Supabase Storage once media service lands.
  images: {
    // Placeholder — will be extended in WP-04 / WP-05.
    remotePatterns: [],
  },
};

export default nextConfig;
