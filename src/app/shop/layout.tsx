/**
 * Shop shell — WP-08.
 * Fixed frosted header so nav stays available while scrolling.
 */

import Link from "next/link";
import { readCartItems } from "@/lib/shop/cart";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const items = await readCartItems();
  const count = items.reduce((n, i) => n + i.quantity, 0);

  return (
    <div className="min-h-screen bg-transparent">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/40 bg-white/60 backdrop-blur-md supports-[backdrop-filter]:bg-white/50">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/shop" className="font-semibold text-primary">
              Rescue Pawtrol Shop
            </Link>
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              {"\u2190"} Animals
            </Link>
          </div>
          <Link
            href="/shop/cart"
            className="text-sm font-medium text-primary hover:underline"
          >
            Cart{count > 0 ? ` (${count})` : ""}
          </Link>
        </div>
      </header>
      <div className="h-14 shrink-0 sm:h-16" aria-hidden />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
