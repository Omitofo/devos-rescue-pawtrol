/**
 * Public discovery home — WP-05 (J-01) + UI polish (hero).
 *
 * Layout: energetic hero → filters → animal grid.
 * Zero account gate (NFR-04, NFR-08).
 */

import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { AnimalCard } from "@/components/AnimalCard";
import { AnimalFilters } from "@/components/AnimalFilters";
import { listPublishedAnimals, type AnimalFilters as Filters } from "@/lib/data/animals";
import { trackEvent } from "@/lib/analytics/track";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const filters: Filters = {
    q: typeof params.q === "string" ? params.q : undefined,
    species: typeof params.species === "string" ? params.species : undefined,
    age_group: typeof params.age_group === "string" ? params.age_group : undefined,
    sex: typeof params.sex === "string" ? params.sex : undefined,
    size: typeof params.size === "string" ? params.size : undefined,
    country: typeof params.country === "string" ? params.country : undefined,
  };

  const animals = await listPublishedAnimals(filters);

  const activeFilters = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v != null && v !== "")
  );
  if (Object.keys(activeFilters).length > 0) {
    await trackEvent({
      event_type: "search_filter",
      metadata: {
        ...activeFilters,
        result_count: animals.length,
        filter_keys: Object.keys(activeFilters),
      },
    });
  }

  return (
    <>
      <SiteHeader />

      {/* Hero — bold color shapes (reference energy) + collage */}
      <section className="relative overflow-hidden border-b border-border bg-[#FFF8F0]">
        {/* Color splashes — solid geometric energy */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-16 h-72 w-72 rounded-full bg-[#FF6B2C] opacity-90 sm:h-96 sm:w-96"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 top-8 h-64 w-64 rounded-[2.5rem] bg-[#7C3AED] opacity-90 sm:h-80 sm:w-80"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 right-1/4 h-40 w-56 rounded-t-[3rem] bg-[#22C55E] opacity-80"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-1/3 top-1/4 h-28 w-28 rounded-full bg-[#FBBF24] opacity-80"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-12 left-1/3 h-24 w-40 rounded-full bg-[#A78BFA] opacity-50 blur-2xl"
        />

        <div className="relative mx-auto grid min-h-[28rem] max-w-6xl items-center gap-8 px-4 py-12 sm:min-h-[32rem] sm:px-6 sm:py-16 lg:min-h-[36rem] lg:grid-cols-2 lg:gap-12 lg:py-20">
          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-[1.08] tracking-tight text-primary sm:text-5xl lg:text-6xl">
              Rescue changes{" "}
              <span className="relative inline-block">
                everything
                <span
                  aria-hidden
                  className="absolute -right-7 -top-1 text-3xl text-[#7C3AED] sm:-right-8 sm:text-4xl"
                >
                  {"\u2665"}
                </span>
              </span>
              .
            </h1>
            <p className="max-w-md text-base text-muted-foreground sm:text-lg">
              Real animals. Real stories. Real impact. Find your new best friend
              from verified rescue organisations{" "}{"\u2014"} no account needed.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#filters"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
              >
                Find an animal
                <span aria-hidden>{"\u2192"}</span>
              </a>
              <Link
                href="/shop"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/90 px-5 py-2.5 text-sm font-medium text-primary backdrop-blur-sm transition hover:bg-muted"
              >
                Shop to help
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl shadow-xl ring-1 ring-black/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/hero-animals.jpg"
                alt="Happy rescued dogs and cats"
                className="h-full w-full object-cover object-center"
              />
            </div>
          </div>
        </div>
      </section>

      <main className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 top-24 h-48 w-48 rounded-full bg-[#FF6B2C]/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 top-64 h-56 w-56 rounded-full bg-[#7C3AED]/10 blur-3xl"
        />

        <section
          id="filters"
          className="relative mb-10 scroll-mt-20"
          aria-label="Search and filters"
        >
          <AnimalFilters current={filters} />
        </section>

        <section id="animals" className="relative scroll-mt-20">
          <h2 className="mb-4 text-xl font-semibold tracking-tight text-primary">
            Animals looking for love{" "}
            <span aria-hidden className="text-[#7C3AED]">
              {"\u2665"}
            </span>
          </h2>
          {animals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-surface-elevated px-6 py-16 text-center">
              <p className="text-base font-medium text-primary">
                No animals match these filters
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Try clearing the search or selecting fewer filters.
              </p>
              <a
                href="/"
                className="mt-4 inline-block text-sm font-medium text-accent-2 underline"
              >
                Clear all filters
              </a>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted-foreground">
                {animals.length} animal{animals.length === 1 ? "" : "s"}
              </p>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {animals.map((animal) => (
                  <AnimalCard key={animal.id} animal={animal} />
                ))}
              </div>
            </>
          )}
        </section>
      </main>
    </>
  );
}
