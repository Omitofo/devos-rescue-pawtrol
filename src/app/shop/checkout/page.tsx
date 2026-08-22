/**
 * Guest checkout — WP-08 + WP-09 (FR-13 / FR-14).
 *
 * Collects shipping details, creates a pending_payment order, then redirects
 * to Stripe Checkout when STRIPE_SECRET_KEY is configured.
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { getCartLines, cartSubtotalCents } from "@/lib/shop/cart";
import { formatMoney } from "@/lib/shop/products";
import { placeGuestOrder } from "@/lib/shop/actions";
import { isStripeConfigured } from "@/lib/stripe/server";

export default async function CheckoutPage() {
  const lines = await getCartLines();
  if (lines.length === 0) redirect("/shop/cart");

  const subtotal = cartSubtotalCents(lines);
  const shipping = subtotal >= 5000 ? 0 : 499;
  const total = subtotal + shipping;
  const currency = lines[0]?.product.currency ?? "EUR";
  const stripeReady = isStripeConfigured();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link
          href="/shop/cart"
          className="text-sm text-muted-foreground hover:text-primary"
        >
          ← Cart
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-primary">Checkout</h1>
        <p className="text-sm text-muted-foreground">
          Guest checkout — no account required.
          {stripeReady
            ? " After you submit, you will be redirected to Stripe to pay securely."
            : " Stripe is not configured on this environment; the order will be recorded as pending payment."}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface-elevated p-4 text-sm">
        <p>Subtotal {formatMoney(subtotal, currency)}</p>
        <p className="text-muted-foreground">
          Shipping {formatMoney(shipping, currency)}
          {shipping === 0 ? " (free over \u20ac50)" : ""}
        </p>
        <p className="mt-2 font-semibold text-primary">
          Total {formatMoney(total, currency)}
        </p>
      </div>

      <form action={placeGuestOrder} className="space-y-4">
        <Field name="email" label="Email" type="email" required />
        <Field name="name" label="Full name" required />
        <Field name="line1" label="Address" required />
        <div className="grid grid-cols-2 gap-3">
          <Field name="city" label="City" required />
          <Field name="postal" label="Postal code" required />
        </div>
        <Field
          name="country"
          label="Country (ISO)"
          placeholder="ES"
          required
          maxLength={2}
        />
        <button
          type="submit"
          className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
        >
          {stripeReady ? "Continue to payment" : "Place order (pending payment)"}
        </button>
      </form>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  placeholder,
  maxLength,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent-2"
      />
    </label>
  );
}
