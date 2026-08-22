/**
 * Stripe webhook handler — WP-09 (FR-14).
 *
 * Responsibilities:
 * - Verify Stripe signature (STRIPE_WEBHOOK_SECRET)
 * - On checkout.session.completed → mark order paid, store payment_intent id
 * - Emit analytics_events.order_completed (best-effort)
 *
 * Fulfilment (POD) is intentionally deferred to WP-10. Status stops at `paid`.
 *
 * Local testing:
 *   stripe listen --forward-to localhost:3000/api/webhooks/stripe
 *
 * Excluded from session proxy matcher via path under /api (proxy still runs
 * unless matched out — webhook does not need cookies).
 */

import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";
import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    logger.error("stripe.webhook_misconfigured", {
      hasStripe: Boolean(stripe),
      hasSecret: Boolean(webhookSecret),
    });
    return NextResponse.json(
      { error: "Stripe webhook not configured" },
      { status: 503 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    logger.error("stripe.webhook_signature_failed", {}, err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      // Optional: payment_intent.succeeded is redundant when using Checkout
      // in payment mode, but kept for resilience if we add PaymentIntents later.
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const orderId = pi.metadata?.order_id;
        if (orderId) {
          await markOrderPaid({
            orderId,
            paymentIntentId: pi.id,
            checkoutSessionId: null,
          });
        }
        break;
      }
      default:
        logger.debug("stripe.webhook_ignored", { type: event.type });
    }
  } catch (err) {
    logger.error("stripe.webhook_handler_failed", { type: event.type }, err);
    // Return 500 so Stripe retries.
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const orderId =
    session.metadata?.order_id || session.client_reference_id || null;

  if (!orderId) {
    logger.warn("stripe.checkout_missing_order_id", { sessionId: session.id });
    return;
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  await markOrderPaid({
    orderId,
    paymentIntentId,
    checkoutSessionId: session.id,
  });
}

async function markOrderPaid(args: {
  orderId: string;
  paymentIntentId: string | null;
  checkoutSessionId: string | null;
}) {
  const supabase = createServiceClient();

  // Idempotent: only transition from pending_payment → paid.
  const { data: existing } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", args.orderId)
    .maybeSingle();

  if (!existing) {
    logger.warn("stripe.order_not_found", { orderId: args.orderId });
    return;
  }

  if (existing.status === "paid") {
    logger.info("stripe.order_already_paid", { orderId: args.orderId });
    return;
  }

  if (existing.status !== "pending_payment") {
    logger.warn("stripe.order_unexpected_status", {
      orderId: args.orderId,
      status: existing.status,
    });
    return;
  }

  const updates: Record<string, unknown> = {
    status: "paid",
    updated_at: new Date().toISOString(),
  };
  if (args.paymentIntentId) {
    updates.stripe_payment_intent_id = args.paymentIntentId;
  }
  if (args.checkoutSessionId) {
    updates.stripe_checkout_session_id = args.checkoutSessionId;
  }

  const { error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", args.orderId)
    .eq("status", "pending_payment");

  if (error) {
    logger.error("stripe.order_mark_paid_failed", { orderId: args.orderId }, error);
    throw error;
  }

  // Day-one analytics: order_completed (WP-11 surface; write path here).
  await supabase.from("analytics_events").insert({
    event_type: "order_completed",
    metadata: {
      order_id: args.orderId,
      stripe_payment_intent_id: args.paymentIntentId,
      stripe_checkout_session_id: args.checkoutSessionId,
    },
  });

  logger.info("stripe.order_paid", {
    orderId: args.orderId,
    paymentIntentId: args.paymentIntentId,
  });
}
