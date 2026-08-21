/**
 * Shop shell — WP-08.
 * Navigationally separated from animal discovery (FR-12), same brand tokens.
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
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-surface-elevated">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/shop" className="font-semibold text-primary">
              Rescue Pawtrol Shop
            </Link>
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              ← Animals
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
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
