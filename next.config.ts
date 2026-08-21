import type { NextConfig } from "next";

/**
 * Next.js configuration for Rescue Pawtrol.
 *
 * WP-01 foundation (updated for Next.js 16 Active LTS).
 * - App Router is the default (no pages/ directory).
 * - Turbopack is the default bundler in Next 16 — no extra flags needed.
 * - Images from Supabase Storage will be added later (WP-04 / WP-05).
 * - No experimental flags until required by a later work package.
 *
 * Note: the old `eslint` key in next.config was removed in Next 16;
 * linting is now handled solely by the ESLint CLI (see package.json scripts).
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
