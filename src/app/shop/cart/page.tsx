/**
 * Guest cart — WP-08.
 */

import Link from "next/link";
import { getCartLines, cartSubtotalCents } from "@/lib/shop/cart";
import { formatMoney } from "@/lib/shop/products";
import { CartQuantity } from "@/components/shop/CartQuantity";

export default async function CartPage() {
  const lines = await getCartLines();
  const subtotal = cartSubtotalCents(lines);
  const currency = lines[0]?.product.currency ?? "EUR";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-primary">Your cart</h1>

        {lines.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
            <p className="text-muted-foreground">Cart is empty.</p>
            <Link
              href="/shop"
              className="mt-4 inline-block text-sm font-medium text-accent-2 underline"
            >
              Browse products
            </Link>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-border rounded-xl border border-border">
              {lines.map((line) => (
                <li
                  key={line.productId}
                  className="flex flex-wrap items-center justify-between gap-4 px-4 py-4"
                >
                  <div>
                    <Link
                      href={`/shop/${line.product.slug}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {line.product.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {formatMoney(line.product.price_cents, line.product.currency)}
                    </p>
                  </div>
                  <CartQuantity
                    productId={line.productId}
                    quantity={line.quantity}
                  />
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-lg font-semibold text-primary">
                Subtotal {formatMoney(subtotal, currency)}
              </p>
              <Link
                href="/shop/checkout"
                className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
              >
                Checkout
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
