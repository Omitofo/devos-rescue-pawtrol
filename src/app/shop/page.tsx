/**
 * Shop catalogue — WP-08 (J-06).
 */

import Link from "next/link";
import { listActiveProducts, formatMoney } from "@/lib/shop/products";

export default async function ShopPage() {
  const products = await listActiveProducts();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-primary">
          Merchandise
        </h1>
        <p className="max-w-xl text-muted-foreground">
          Co-branded goods that support rescue work. Guest checkout — no account
          needed. This shop is separate from animal discovery.
        </p>
      </div>

      {products.length === 0 ? (
        <p className="text-sm text-muted-foreground">No products available yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/shop/${p.slug}`}
              className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface-elevated transition hover:border-primary/30 hover:shadow-sm"
            >
              <div className="flex aspect-[4/3] items-center justify-center bg-muted text-4xl">
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.image_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  "🛍️"
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1 p-4">
                <h2 className="font-semibold text-primary group-hover:underline">
                  {p.name}
                </h2>
                {p.description && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {p.description}
                  </p>
                )}
                <p className="mt-auto pt-2 text-sm font-medium text-primary">
                  {formatMoney(p.price_cents, p.currency)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
