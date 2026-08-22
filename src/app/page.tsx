/**
 * Public discovery home — WP-05 (J-01).
 *
 * SSR grid of published animals + filters.
 * Zero account gate (NFR-04, NFR-08).
 */

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

  // WP-11: filter usage metric — fire when any search/filter is applied
  // Visible on /admin under analytics as "search filter" (7-day count).
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
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <section className="mb-10 space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
            Find a rescued friend
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Browse animals from verified rescue organisations. No account needed —
            when you find someone special, we&apos;ll connect you with the rescue
            that cares for them.
          </p>
        </section>

        <section className="mb-8">
          <AnimalFilters current={filters} />
        </section>

        <section>
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
