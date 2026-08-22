/**
 * Order confirmation / payment status — WP-08 + WP-09.
 *
 * Guest can view by id after redirect (no listing of others' orders).
 * - pending_payment → show Pay with Stripe (when configured) or pending message
 * - paid → success copy
 * - cancelled query param → invite to retry payment
 */

import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/shop/products";
import { isStripeConfigured } from "@/lib/stripe/server";
import { PayOrderButton } from "@/components/shop/PayOrderButton";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ session_id?: string; cancelled?: string }>;

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const query = await searchParams;

  let order: {
    id: string;
    status: string;
    customer_email: string;
    total_cents: number;
    currency: string;
    stripe_checkout_session_id: string | null;
  } | null = null;

  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("orders")
      .select(
        "id, status, customer_email, total_cents, currency, stripe_checkout_session_id"
      )
      .eq("id", id)
      .maybeSingle();
    order = data;
  } catch {
    // Service role missing or network — fall through to generic message.
  }

  const stripeReady = isStripeConfigured();
  const cancelled = query.cancelled === "1";
  const justReturnedFromStripe = Boolean(query.session_id);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold text-primary">
        {order?.status === "paid" ? "Payment received" : "Order status"}
      </h1>

      {order ? (
        <>
          <p className="text-muted-foreground">
            Order{" "}
            <span className="font-mono text-xs text-primary">
              {order.id.slice(0, 8)}…
            </span>{" "}
            for {order.customer_email}.
          </p>
          <p className="text-lg font-medium text-primary">
            {formatMoney(order.total_cents, order.currency)}
          </p>

          <div className="rounded-xl border border-border bg-surface-elevated p-4 text-sm space-y-2">
            <p>
              Status:{" "}
              <strong className="capitalize">
                {order.status.replace(/_/g, " ")}
              </strong>
            </p>

            {order.status === "paid" && (
              <p className="text-muted-foreground">
                Thank you. Your payment was confirmed
                {justReturnedFromStripe ? " via Stripe" : ""}. Fulfilment will
                be handled in a later step (print-on-demand).
              </p>
            )}

            {order.status === "pending_payment" && cancelled && (
              <p className="text-amber-700 dark:text-amber-400">
                Checkout was cancelled. You can try again below.
              </p>
            )}

            {order.status === "pending_payment" && !stripeReady && (
              <p className="text-muted-foreground">
                Card payment is not configured on this environment
                (missing <code className="text-xs">STRIPE_SECRET_KEY</code>).
                The order is recorded as pending payment.
              </p>
            )}

            {order.status === "pending_payment" && stripeReady && (
              <p className="text-muted-foreground">
                Complete payment securely on Stripe&apos;s hosted checkout
                (cards, Apple Pay, and Google Pay when enabled).
              </p>
            )}
          </div>

          {order.status === "pending_payment" && stripeReady && (
            <PayOrderButton orderId={order.id} />
          )}
        </>
      ) : (
        <p className="text-muted-foreground">
          Order reference saved. If you just checked out, you&apos;re all set —
          refresh in a moment if status does not appear yet.
        </p>
      )}

      <Link
        href="/shop"
        className="inline-block text-sm text-accent-2 underline"
      >
        Back to shop
      </Link>
    </div>
  );
}
