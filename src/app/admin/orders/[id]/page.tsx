/**
 * Admin order detail — items, shipping, status, POD submit (WP-10).
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderAdmin } from "@/lib/data/admin";
import { updateOrderStatus, submitOrderToPodAction } from "@/lib/admin/actions";
import { getPodProviderStatus } from "@/lib/pod";

type Params = Promise<{ id: string }>;

const NEXT_STATUSES = [
  "pending_payment",
  "paid",
  "fulfilment_submitted",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
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

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const order = await getOrderAdmin(id);
  if (!order) notFound();

  const podStatus = getPodProviderStatus();

  const addr = order.shipping_address as
    | { line1?: string; city?: string; postal?: string; country?: string }
    | null;

  async function setStatus(formData: FormData) {
    "use server";
    const orderId = String(formData.get("order_id") ?? "");
    const status = String(formData.get("status") ?? "");
    if (orderId) await updateOrderStatus(orderId, status);
  }

  async function submitPod(formData: FormData) {
    "use server";
    const orderId = String(formData.get("order_id") ?? "");
    if (orderId) await submitOrderToPodAction(orderId);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link
          href="/admin/orders"
          className="text-sm text-muted-foreground hover:text-primary"
        >
          \u2190 All orders
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-primary">Order</h1>
        <p className="font-mono text-xs text-muted-foreground">{order.id}</p>
      </div>

      <div className="rounded-xl border border-border bg-surface-elevated p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium">
            {order.status.replaceAll("_", " ")}
          </span>
          <span className="text-lg font-semibold text-primary">
            {formatMoney(order.total_cents, order.currency)}
          </span>
        </div>
        <p className="text-sm">
          <span className="text-muted-foreground">Customer: </span>
          {order.customer_name ?? "\u2014"} \u00b7 {order.customer_email}
        </p>
        <p className="text-sm text-muted-foreground">
          Created {new Date(order.created_at).toLocaleString()}
          {order.updated_at !== order.created_at &&
            ` \u00b7 Updated ${new Date(order.updated_at).toLocaleString()}`}
        </p>
        {order.stripe_checkout_session_id && (
          <p className="text-xs text-muted-foreground">
            Stripe session: {order.stripe_checkout_session_id}
          </p>
        )}
        {(order.pod_provider || order.pod_order_id) && (
          <p className="text-xs text-muted-foreground">
            POD: {order.pod_provider ?? "\u2014"}
            {order.pod_order_id ? ` / ${order.pod_order_id}` : ""}
            {order.pod_status ? ` \u00b7 ${order.pod_status}` : ""}
          </p>
        )}
      </div>

      {addr && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Shipping
          </h2>
          <p className="text-sm text-primary">
            {[addr.line1, addr.city, addr.postal, addr.country]
              .filter(Boolean)
              .join(", ")}
          </p>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Items
        </h2>
        <ul className="divide-y divide-border rounded-xl border border-border">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="flex justify-between gap-3 px-4 py-3 text-sm"
            >
              <span>
                {item.product_name}{" "}
                <span className="text-muted-foreground">\u00d7 {item.quantity}</span>
              </span>
              <span className="font-medium">
                {formatMoney(
                  item.unit_price_cents * item.quantity,
                  order.currency
                )}
              </span>
            </li>
          ))}
        </ul>
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>Subtotal: {formatMoney(order.subtotal_cents, order.currency)}</p>
          <p>Shipping: {formatMoney(order.shipping_cents, order.currency)}</p>
          <p className="font-medium text-primary">
            Total: {formatMoney(order.total_cents, order.currency)}
          </p>
        </div>
      </section>

      {(order.status === "paid" ||
        order.status === "fulfilment_submitted") && (
        <section className="space-y-3 rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold text-primary">POD fulfilment</h2>
          <p className="text-xs text-muted-foreground">
            Active provider: <strong>{podStatus.active}</strong>
            {podStatus.configured.length > 0
              ? ` (keys seen: ${podStatus.configured.join(", ")})`
              : " (no live keys \u2014 mock)"}
            . {podStatus.note}
          </p>
          {order.pod_order_id ? (
            <p className="text-sm text-primary">
              Already submitted \u00b7 {order.pod_provider} / {order.pod_order_id}
              {order.pod_status ? ` \u00b7 ${order.pod_status}` : ""}
            </p>
          ) : (
            <form action={submitPod}>
              <input type="hidden" name="order_id" value={order.id} />
              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Submit to POD
              </button>
            </form>
          )}
        </section>
      )}

      <section className="space-y-3 rounded-xl border border-border p-5">
        <h2 className="text-sm font-semibold text-primary">Update status</h2>
        <p className="text-xs text-muted-foreground">
          Stripe webhook normally moves orders to <code>paid</code>. After POD
          submit, status becomes <code>fulfilment_submitted</code>.
        </p>
        <form action={setStatus} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="order_id" value={order.id} />
          <label className="block space-y-1 text-sm">
            <span className="text-xs text-muted-foreground">Status</span>
            <select
              name="status"
              defaultValue={order.status}
              className="block rounded-md border border-border bg-surface px-3 py-2 text-sm"
            >
              {NEXT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Save
          </button>
        </form>
      </section>
    </div>
  );
}
