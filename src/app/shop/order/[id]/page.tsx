/**
 * Order confirmation — WP-08.
 * Guest can view by id after redirect (no listing of others' orders).
 */

import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/shop/products";

type Params = Promise<{ id: string }>;

export default async function OrderConfirmationPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;

  let order: {
    id: string;
    status: string;
    customer_email: string;
    total_cents: number;
    currency: string;
  } | null = null;

  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("orders")
      .select("id, status, customer_email, total_cents, currency")
      .eq("id", id)
      .maybeSingle();
    order = data;
  } catch {
    order = null;
  }

  return (
    <div className="mx-auto max-w-md space-y-4 text-center">
      <h1 className="text-2xl font-semibold text-primary">Order received</h1>
      {order ? (
        <>
          <p className="text-muted-foreground">
            We recorded order{" "}
            <span className="font-mono text-xs text-primary">{order.id.slice(0, 8)}…</span>{" "}
            for {order.customer_email}.
          </p>
          <p className="text-lg font-medium text-primary">
            {formatMoney(order.total_cents, order.currency)}
          </p>
          <p className="text-sm text-muted-foreground">
            Status: <strong>{order.status}</strong>
            {order.status === "pending_payment" &&
              " — card payment will be enabled in a follow-up (Stripe)."}
          </p>
        </>
      ) : (
        <p className="text-muted-foreground">
          Order reference saved. If you just checked out, you&apos;re all set.
        </p>
      )}
      <Link href="/shop" className="inline-block text-sm text-accent-2 underline">
        Back to shop
      </Link>
    </div>
  );
}
