/**
 * Stripe Checkout Session helpers — WP-09.
 *
 * Creates a hosted Checkout Session for a pending_payment order.
 * Metadata carries order_id so the webhook can mark the order paid.
 */

import type Stripe from "stripe";
import { getStripe, getSiteUrl } from "./server";
import { logger } from "@/lib/logger";

export type OrderLineForCheckout = {
  product_name: string;
  quantity: number;
  unit_price_cents: number;
};

export type CreateCheckoutResult =
  | { ok: true; sessionId: string; url: string }
  | { ok: false; error: string };

/**
 * Build a Stripe Checkout Session for an existing pending order.
 * Returns the hosted URL to redirect the guest to.
 */
export async function createCheckoutSessionForOrder(args: {
  orderId: string;
  customerEmail: string;
  currency: string;
  shippingCents: number;
  lines: OrderLineForCheckout[];
}): Promise<CreateCheckoutResult> {
  const stripe = getStripe();
  if (!stripe) {
    return {
      ok: false,
      error:
        "Stripe is not configured (STRIPE_SECRET_KEY missing). Order remains pending_payment.",
    };
  }

  const site = getSiteUrl();
  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] =
    args.lines.map((line) => ({
      quantity: line.quantity,
      price_data: {
        currency: args.currency.toLowerCase(),
        unit_amount: line.unit_price_cents,
        product_data: {
          name: line.product_name,
        },
      },
    }));

  // Shipping as a separate line when non-zero (keeps product prices clean).
  if (args.shippingCents > 0) {
    line_items.push({
      quantity: 1,
      price_data: {
        currency: args.currency.toLowerCase(),
        unit_amount: args.shippingCents,
        product_data: {
          name: "Shipping",
        },
      },
    });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: args.customerEmail,
      line_items,
      // Carry order id so webhook can resolve without extra lookup tables.
      client_reference_id: args.orderId,
      metadata: {
        order_id: args.orderId,
      },
      success_url: `${site}/shop/order/${args.orderId}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/shop/order/${args.orderId}?cancelled=1`,
      // Automatic payment methods (cards + wallets when enabled in Dashboard).
      // Apple Pay / Google Pay appear when domain is verified and wallet is on.
    });

    if (!session.url) {
      logger.error("stripe.checkout_no_url", { orderId: args.orderId });
      return { ok: false, error: "Stripe did not return a checkout URL." };
    }

    logger.info("stripe.checkout_session_created", {
      orderId: args.orderId,
      sessionId: session.id,
    });

    return { ok: true, sessionId: session.id, url: session.url };
  } catch (err) {
    logger.error("stripe.checkout_create_failed", { orderId: args.orderId }, err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to create Checkout Session",
    };
  }
}
