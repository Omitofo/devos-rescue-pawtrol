/**
 * Admin order list — ops visibility for guest shop (WP-08/09).
 *
 * Platform staff only (layout guard). Filter by status via searchParams.
 */

import Link from "next/link";
import { listOrders, countOrdersByStatus } from "@/lib/data/admin";

type SearchParams = Promise<{ status?: string }>;

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "pending_payment", label: "Pending payment" },
  { value: "paid", label: "Paid" },
  { value: "fulfilment_submitted", label: "Fulfilment submitted" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
] as const;

function formatMoney(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: currency || "EUR",
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const q = await searchParams;
  const status = q.status && q.status.length > 0 ? q.status : undefined;

  const [orders, counts] = await Promise.all([
    listOrders({ status, limit: 100 }),
    countOrdersByStatus(),
  ]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Orders</h1>
          <p className="text-sm text-muted-foreground">
            Guest shop orders · payment and fulfilment status
          </p>
        </div>
        <Link href="/admin" className="text-sm text-muted-foreground underline">
          ← Dashboard
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        {STATUS_FILTERS.map((f) => {
          const active = (status ?? "") === f.value;
          const n = f.value ? counts[f.value] ?? 0 : total;
          return (
            <Link
              key={f.value || "all"}
              href={f.value ? `/admin/orders?status=${f.value}` : "/admin/orders"}
              className={`rounded-full px-3 py-1 ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-primary"
              }`}
            >
              {f.label}
              <span className="ml-1 opacity-70">({n})</span>
            </Link>
          );
        })}
      </div>

      {orders.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
          No orders{status ? ` with status “${status.replaceAll("_", " ”)}”` : ""}.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">POD</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-border">
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(o.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-primary">
                      {o.customer_name ?? "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {o.customer_email}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                      {o.status.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {formatMoney(o.total_cents, o.currency)}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {o.pod_provider
                      ? `${o.pod_provider}${o.pod_status ? ` · ${o.pod_status}` : ""}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="text-accent-2 underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
