/**
 * Discovery filters — WP-05 (J-01).
 *
 * GET-based form so results are shareable / crawlable (SSR).
 * Mobile: collapsible <details> (summary visible).
 * Desktop (sm+): filters always visible — summary hidden, panel forced open.
 *
 * NOTE: Tailwind `sm:open` does NOT set the HTML open attribute. We must use
 * the real `open` prop so the filter grid is shown when the summary is hidden.
 */

import type { AnimalFilters as Filters } from "@/lib/data/animals";

const SPECIES = ["dog", "cat", "other"];
const AGE_GROUPS = ["puppy/kitten", "young", "adult", "senior"];
const SEXES = ["male", "female", "unknown"];
const SIZES = ["small", "medium", "large", "xlarge"];

export function AnimalFilters({ current }: { current: Filters }) {
  return (
    <form method="get" className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Search</span>
          <input
            type="search"
            name="q"
            defaultValue={current.q ?? ""}
            placeholder="Name, breed, city…"
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent-2"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Apply
        </button>
      </div>

      {/* `open` keeps the panel expanded by default so desktop (where summary is
          hidden) still shows species/age/sex/size. Mobile can still collapse. */}
      <details
        open
        className="group rounded-lg border border-border bg-surface-elevated p-3 sm:border-0 sm:bg-transparent sm:p-0"
      >
        <summary className="cursor-pointer list-none text-sm font-medium text-primary sm:hidden [&::-webkit-details-marker]:hidden">
          Filters
        </summary>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:mt-0 sm:grid-cols-4">
          <FilterSelect
            name="species"
            label="Species"
            options={SPECIES}
            value={current.species}
          />
          <FilterSelect
            name="age_group"
            label="Age"
            options={AGE_GROUPS}
            value={current.age_group}
          />
          <FilterSelect name="sex" label="Sex" options={SEXES} value={current.sex} />
          <FilterSelect name="size" label="Size" options={SIZES} value={current.size} />
        </div>
      </details>
    </form>
  );
}

function FilterSelect({
  name,
  label,
  options,
  value,
}: {
  name: string;
  label: string;
  options: string[];
  value?: string;
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <select
        name={name}
        defaultValue={value ?? ""}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent-2"
      >
        <option value="">Any</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
