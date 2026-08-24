/**
 * Admin analytics — entity rankings, filters, daily histogram.
 * Aggregate only; no PII. Built on analytics_events (WP-11+).
 */

import Link from "next/link";
import {
  getAnalyticsSummary,
  getTopByEvent,
  getDailyEventCounts,
  getFilterUsageStats,
} from "@/lib/data/admin";
import {
  AnalyticsBars,
  AnalyticsDayChart,
} from "@/components/admin/AnalyticsBars";

type SearchParams = Promise<{ days?: string }>;

const PERIODS = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
] as const;

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const raw = Number(params.days);
  const days = raw === 30 || raw === 90 ? raw : 7;

  const [
    summary,
    topAnimals,
    topOrgs,
    topProducts,
    topCart,
    daily,
    filters,
  ] = await Promise.all([
    getAnalyticsSummary(days),
    getTopByEvent({
      eventType: "animal_view",
      idField: "animal_id",
      days,
      limit: 12,
    }),
    getTopByEvent({
      eventType: "org_view",
      idField: "org_id",
      days,
      limit: 12,
    }),
    getTopByEvent({
      eventType: "product_view",
      idField: "product_id",
      days,
      limit: 12,
    }),
    getTopByEvent({
      eventType: "add_to_cart",
      idField: "product_id",
      days,
      limit: 8,
    }),
    getDailyEventCounts({ days }),
    getFilterUsageStats(days, 20),
  ]);

  const totalEvents = summary.reduce((n, r) => n + r.count, 0);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="text-sm text-muted-foreground hover:text-primary"
          >
            {"\u2190"} Dashboard
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-primary">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Platform usage by entity and day. No PII — counts only.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <Link
              key={p.days}
              href={`/admin/analytics?days=${p.days}`}
              className={
                p.days === days
                  ? "rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
                  : "rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-primary"
              }
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Events in period" value={totalEvents} />
        <Stat label="Event types" value={summary.length} />
        <Stat label="Active filter combos" value={filters.length} />
      </div>

      <section className="space-y-3 rounded-xl border border-border bg-surface-elevated p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-primary">Activity by day</h2>
          <span className="text-xs text-muted-foreground">
            All event types \u00b7 last {days}d
          </span>
        </div>
        <AnalyticsDayChart days={daily} />
        <p className="text-xs text-muted-foreground">
          Hover bars for date + count. Empty days still appear as gaps in the
          series.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-primary">Event totals</h2>
        {summary.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events yet.</p>
        ) : (
          <div className="rounded-xl border border-border bg-surface-elevated p-4">
            <AnalyticsBars
              items={summary.map((s) => ({
                label: s.event_type,
                count: s.count,
              }))}
            />
          </div>
        )}
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <RankTable title="Top animals (views)" hrefPrefix="/animals/" rows={topAnimals} />
        <RankTable title="Top organisations (views)" rows={topOrgs} />
        <RankTable title="Top products (views)" rows={topProducts} />
        <RankTable title="Top add-to-cart" rows={topCart} />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-primary">Filter usage</h2>
        <p className="text-sm text-muted-foreground">
          Discrete filters from discovery searches (species, age, sex, size,
          country). Free-text queries counted only as &quot;text search&quot;.
        </p>
        {filters.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No filter events in this period.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[20rem] text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Filter</th>
                  <th className="px-4 py-2 font-medium">Value</th>
                  <th className="px-4 py-2 font-medium text-right">Count</th>
                </tr>
              </thead>
              <tbody>
                {filters.map((f) => (
                  <tr
                    key={`${f.key}-${f.value}`}
                    className="border-b border-border/60"
                  >
                    <td className="px-4 py-2 font-medium text-primary">{f.key}</td>
                    <td className="px-4 py-2 text-muted-foreground">{f.value}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{f.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface-elevated px-4 py-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-3xl font-semibold text-primary">{value}</p>
    </div>
  );
}

function RankTable({
  title,
  rows,
  hrefPrefix,
}: {
  title: string;
  rows: { id: string; label: string; count: number }[];
  hrefPrefix?: string;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-primary">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No data yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">#</th>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium text-right">Count</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className="border-b border-border/60">
                  <td className="px-4 py-2 text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-2 font-medium text-primary">
                    {hrefPrefix ? (
                      <Link href={`${hrefPrefix}${r.id}`} className="hover:underline">
                        {r.label}
                      </Link>
                    ) : (
                      r.label
                    )}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{r.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
