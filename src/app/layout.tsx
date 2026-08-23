import type { Metadata } from "next";
import "./globals.css";
import { BrandBackdrop } from "@/components/BrandBackdrop";

/**
 * Root layout — WP-01 foundation + brand color backdrop.
 */

export const metadata: Metadata = {
  title: {
    default: "Rescue Pawtrol",
    template: "%s \u00b7 Rescue Pawtrol",
  },
  description:
    "Discover rescued animals from legitimate organisations. Find your next companion and support the mission through our shop.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="relative min-h-screen antialiased">
        <BrandBackdrop />
        <div className="relative z-0">{children}</div>
      </body>
    </html>
  );
}
