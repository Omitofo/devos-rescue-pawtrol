/**
 * Shop catalogue — WP-08 (J-06).
 *
 * Hero inspired by merch landing mock: light band, color blobs, copy left,
 * product visual right. Image path is easy to swap when the real shot is ready.
 */

import Link from "next/link";
import { listActiveProducts, formatMoney } from "@/lib/shop/products";

/**
 * Preferred: public/brand/shop-hero.jpg (hoodie / merch lifestyle).
 * Temporary stand-in until that asset is added.
 */
const SHOP_HERO_SRC = "/brand/hero-animals.jpg";

export default async function ShopPage() {
  const products = await listActiveProducts();

  return (
    <>
      <section className="relative -mt-14 overflow-hidden bg-[#FFF8F0] sm:-mt-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-16 top-8 h-48 w-48 rounded-full bg-[#FF6B2C]/70 sm:-left-20 sm:h-72 sm:w-72"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 top-24 h-36 w-36 rounded-full bg-[#FBBF24]/80 sm:right-[28%] sm:top-16 sm:h-44 sm:w-44"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-8 left-1/3 hidden h-32 w-48 rounded-[2.5rem] bg-[#22C55E]/70 sm:block"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 bottom-0 h-56 w-40 rounded-t-[3rem] bg-[#7C3AED]/55 sm:-right-6 sm:h-72 sm:w-52"
        />

        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 pb-12 pt-20 sm:px-6 sm:pb-16 sm:pt-24 lg:grid-cols-2 lg:gap-12 lg:pb-20 lg:pt-28">
          <div className="relative z-10 space-y-5">
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-primary sm:text-5xl lg:text-6xl">
              Wear the mission
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-primary/80 sm:text-base">
              Show your support for rescues and help animals everywhere. Every
              purchase makes a difference. Guest checkout — no account needed.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <a
                href="#products"
                className="inline-flex items-center justify-center rounded-full bg-[#FF6B2C] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
              >
                Shop all
              </a>
              <a
                href="#products"
                className="inline-flex items-center justify-center rounded-full border border-border bg-white/90 px-5 py-2.5 text-sm font-medium text-primary shadow-sm transition hover:bg-white"
              >
                Browse merch
              </a>
            </div>
          </div>

          <div className="relative z-10 mx-auto w-full max-w-md lg:max-w-none">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.75rem] bg-white shadow-xl ring-1 ring-black/5 sm:rounded-[2rem]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={SHOP_HERO_SRC}
                alt="Rescue Pawtrol merchandise"
                className="h-full w-full object-cover object-center"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
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
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition hover:border-primary/20 hover:shadow-md"
                >
                  <div className="flex aspect-square items-center justify-center bg-[#FAFAF8] text-4xl">
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
