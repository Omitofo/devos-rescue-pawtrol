import type { Metadata } from "next";
import "./globals.css";
import { BrandBackdrop } from "@/components/BrandBackdrop";
import { SiteHeader } from "@/components/SiteHeader";

/**
 * Root layout — fixed header; content uses pt so it clears the bar.
 * Home hero pulls up with negative margin so color sits under the glass.
 */

export const metadata: Metadata = {
  title: {
    default: "Rescue Pawtrol",
    template: "%s · Rescue Pawtrol",
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
      <body className="relative min-h-screen overflow-x-hidden antialiased">
        <BrandBackdrop />
        <div className="relative z-0 min-w-0">
          <SiteHeader />
          <div className="pt-14 sm:pt-16">{children}</div>
        </div>
      </body>
    </html>
  );
}
