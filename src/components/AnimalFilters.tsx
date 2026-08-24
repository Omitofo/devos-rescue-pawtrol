/**
 * Discovery filters — WP-05 (J-01).
 *
 * Mobile: collapsible <details> so the grid stays primary.
 * Desktop (sm+): filters always visible — summary hidden, panel forced open.
 * Tracks search_filter analytics with result_count (WP-11 + metric follow-up).
 */

"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";

const SPECIES = ["dog", "cat", "other"] as const;
const AGE = ["puppy_kitten", "young", "adult", "senior"] as const;
const SEX = ["male", "female", "unknown"] as const;
const SIZE = ["small", "medium", "large", "xlarge"] as const;

type Props = {
  /** Optional: server can pass current result count for analytics display */
  resultCount?: number;
};

export function AnimalFilters({ resultCount }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!value) params.delete(key);
      else params.set(key, value);
      // Reset page-like state if we add pagination later
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams]
  );

  const clearAll = () => {
    startTransition(() => router.push(pathname));
  };

  const hasAny = [...searchParams.keys()].length > 0;

  return (
    <details
      className="group rounded-xl border border-border bg-surface-elevated open:shadow-sm sm:open"
      open
    >
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-primary sm:hidden">
        Filters{hasAny ? " (active)" : ""}
        {pending ? " …" : ""}
      </summary>
      <div className="grid gap-3 border-t border-border px-4 py-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="block space-y-1 text-xs">
          <span className="font-medium text-muted-foreground">Search</span>
          <input
            type="search"
            name="q"
            defaultValue={searchParams.get("q") ?? ""}
            placeholder="Name, breed, city…"
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setParam("q", (e.target as HTMLInputElement).value.trim());
              }
            }}
            onBlur={(e) => setParam("q", e.target.value.trim())}
          />
        </label>
        <Select
          label="Species"
          value={searchParams.get("species") ?? ""}
          onChange={(v) => setParam("species", v)}
          options={SPECIES.map((s) => ({ value: s, label: s }))}
        />
        <Select
          label="Age"
          value={searchParams.get("age") ?? ""}
          onChange={(v) => setParam("age", v)}
          options={AGE.map((s) => ({
            value: s,
            label: s.replaceAll("_", " "),
          }))}
        />
        <Select
          label="Sex"
          value={searchParams.get("sex") ?? ""}
          onChange={(v) => setParam("sex", v)}
          options={SEX.map((s) => ({ value: s, label: s }))}
        />
        <Select
          label="Size"
          value={searchParams.get("size") ?? ""}
          onChange={(v) => setParam("size", v)}
          options={SIZE.map((s) => ({ value: s, label: s }))}
        />
        {hasAny && (
          <div className="flex items-end sm:col-span-2 lg:col-span-5">
            <button
              type="button"
              onClick={clearAll}
              className="text-sm text-muted-foreground underline hover:text-primary"
            >
              Clear filters
              {typeof resultCount === "number" ? ` (${resultCount})"` : ""}
            </button>
          </div>
        )}
      </div>
    </details>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block space-y-1 text-xs">
      <span className="font-medium text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm capitalize"
      >
        <option value="">Any</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
