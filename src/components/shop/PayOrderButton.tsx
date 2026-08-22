"use client";

/**
 * Pay pending order — WP-09.
 * Triggers server action that creates a Stripe Checkout Session and redirects.
 */

import { useTransition } from "react";
import { payPendingOrder } from "@/lib/shop/actions";

export function PayOrderButton({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await payPendingOrder(orderId);
          // redirect() throws; if we get a result it is an error path.
          if (result && !result.ok) {
            alert(result.error);
          }
        });
      }}
      className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60 sm:w-auto"
    >
      {pending ? "Redirecting to Stripe\u2026" : "Pay securely with Stripe"}
    </button>
  );
}
