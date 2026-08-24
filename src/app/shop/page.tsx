/**
 * Shop catalogue — WP-08 (J-06).
 *
 * Hero: full-bleed merch band under the glass header.
 * Background: public/brand/shop-hero.jpg when available;
 * until then we use hero-animals.jpg (same folder).
 */

import Link from "next/link";
import { listActiveProducts, formatMoney } from "@/lib/shop/products";

/**
 * Swap this path when the real merch photo is ready:
 * drop the file at public/brand/shop-hero.jpg and set
 * SHOP_HERO_SRC = "/brand/shop-hero.jpg"
 */
const SHOP_HERO_SRC = "/brand/hero-animals.jpg";

export default async function ShopPage() {
  const products = await listActiveProducts();

  return (
    <>
      <section className="relative -mt-14 min-h-[18rem] overflow-hidden sm:-mt-16 sm:min-h-[22rem] lg:min-h-[26rem]">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={SHOP_HERO_SRC}
            alt=""
            className="h-full w-full object-cover object-center"
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/25"
            aria-hidden
          />
        </div>

        <div className="relative mx-auto flex min-h-[18rem] max-w-5xl flex-col justify-end px-4 pb-10 pt-20 sm:min-h-[22rem] sm:px-6 sm:pb-12 sm:pt-24 lg:min-h-[26rem] lg:pb-14">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-white/80">
            Rescue Pawtrol shop
          </p>
          <h1 className="max-w-xl text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Merchandise
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/90 sm:text-base">
            Co-branded goods that support rescue work. Guest checkout — no
            account needed. This shop is separate from animal discovery.
          </p>
          <div className="mt-6">
            <a
              href="#products"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-primary shadow-sm transition hover:bg-white/90"
            >
              Browse products
              <span aria-hidden>&rarr;</span>
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <section id="products" className="scroll-mt-24" aria-label="Products">
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No products available yet.
            </p>
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
        </section>
      </div>
    </>
  );
}
