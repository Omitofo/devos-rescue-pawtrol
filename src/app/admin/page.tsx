/**
 * Admin dashboard — WP-07 / J-08.
 */

import Link from "next/link";
import {
  listAllOrganizations,
  listLeads,
  listRecentInterest,
  countPublishedAnimals,
  getAnalyticsSummary,
  countOrdersByStatus,
} from "@/lib/data/admin";

export default async function AdminDashboardPage() {
  const [orgs, leads, interest, publishedCount, analytics, orderCounts] =
    await Promise.all([
      listAllOrganizations(),
      listLeads(10),
      listRecentInterest(10),
      countPublishedAnimals(),
      getAnalyticsSummary(7),
      countOrdersByStatus(),
    ]);
  const paidOrders = orderCounts["paid"] ?? 0;
  const pendingOrders = orderCounts["pending_payment"] ?? 0;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Organisations, leads, interest CTAs, and day-one analytics.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/analytics"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-primary"
          >
            Analytics
          </Link>
          <Link
            href="/admin/orders"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-primary"
          >
            Orders
          </Link>
          <Link
            href="/admin/organizations/new"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Provision organisation
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Organisations" value={orgs.length} />
        <Stat label="Published animals" value={publishedCount} />
        <Stat
          label="Open leads"
          value={leads.filter((l) => l.status === "new").length}
        />
        <Stat label="Paid orders" value={paidOrders} />
        <Stat label="Pending payment" value={pendingOrders} />
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-primary">
            Analytics (last 7 days)
          </h2>
          <Link
            href="/admin/analytics"
            className="text-sm text-accent-2 underline"
          >
            Full analytics
          </Link>
        </div>
        {analytics.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No events yet. Views, searches, cart, and checkout will appear here.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {analytics.map((row) => (
              <div
                key={row.event_type}
                className="rounded-xl border border-border bg-surface-elevated px-4 py-4"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {row.event_type.replace(/_/g, " ")}
                </p>
                <p className="mt-1 text-2xl font-semibold text-primary">
                  {row.count}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-primary">Organisations</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Location</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((o) => (
                <tr key={o.id} className="border-b border-border/60">
                  <td className="px-4 py-2">
                    <Link
                      href={`/admin/organizations/${o.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {o.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{o.status}</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {[o.city, o.country_code].filter(Boolean).join(", ") ||
                      "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-primary">Recent leads</h2>
          {leads.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leads yet.</p>
          ) : (
            <ul className="space-y-2">
              {leads.map((l) => (
                <li
                  key={l.id}
                  className="rounded-lg border border-border bg-surface-elevated px-4 py-3 text-sm"
                >
                  <div className="flex justify-between gap-2">
                    <span className="font-medium">
                      {l.organization_name ?? l.name ?? l.email}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {l.status}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{l.email}</p>
                  {l.message && (
                    <p className="mt-1 line-clamp-2 text-primary/80">
                      {l.message}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-primary">
            Recent interest CTAs
          </h2>
          {interest.length === 0 ? (
            <p className="text-sm text-muted-foreground">No interest events yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {interest.map((ev) => (
                <li
                  key={ev.id}
                  className="rounded-lg border border-border px-4 py-2 text-muted-foreground"
                >
                  <span className="font-mono text-xs">
                    {ev.animal_id?.slice(0, 8)}\u2026
                  </span>
                  {" \u00b7 "}
                  {new Date(ev.created_at).toLocaleString()}
                </li>
              ))}
            </ul>
          )}
        </div>
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
