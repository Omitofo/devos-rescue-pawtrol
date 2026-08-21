import type { Metadata } from "next";
import "./globals.css";

/**
 * Root layout — WP-01 foundation.
 *
 * Responsibilities at this stage:
 * - Load global CSS (tokens + Tailwind)
 * - Provide a minimal, accessible HTML shell
 * - Set baseline metadata (will be expanded per-route later)
 *
 * Auth providers, i18n providers, analytics, and elevated-session
 * context will be introduced in their respective work packages
 * (WP-03, WP-16, WP-11, etc.). Keep this layout lean.
 */

export const metadata: Metadata = {
  title: {
    default: "Rescue Pawtrol",
    template: "%s · Rescue Pawtrol",
  },
  description:
    "Discover rescued animals from legitimate organisations. Find your next companion and support the mission through our shop.",
  // Open Graph / Twitter cards will be refined once public pages exist (WP-05).
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
