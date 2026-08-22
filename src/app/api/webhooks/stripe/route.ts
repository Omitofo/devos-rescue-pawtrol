/**
 * Stripe webhook handler — WP-09 (FR-14).
 *
 * Responsibilities:
 * - Verify Stripe signature (STRIPE_WEBHOOK_SECRET)
 * - On checkout.session.completed → mark order paid, store payment_intent id
 * - Emit analytics_events.order_completed (best-effort)
 *
 * Fulfilment (POD, WP-10): optional auto-submit when POD_AUTO_SUBMIT=1.
 * Default stops at `paid`; admin can submit from /admin/orders/[id].
 *
 * Local testing:
 *   stripe listen --forward-to localhost:3000/api/webhooks/stripe
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

  // WP-10: optional auto POD submit (off by default)
  if (process.env.POD_AUTO_SUBMIT === "1") {
    try {
      const { submitOrderToPod } = await import("@/lib/pod/submit");
      const pod = await submitOrderToPod(args.orderId);
      if (pod.ok) {
        logger.info("pod.auto_submit_ok", {
          orderId: args.orderId,
          provider: pod.provider,
          podOrderId: pod.podOrderId,
        });
      } else {
        logger.warn("pod.auto_submit_failed", {
          orderId: args.orderId,
          error: pod.error,
        });
      }
    } catch (err) {
      logger.warn("pod.auto_submit_exception", { orderId: args.orderId }, err);
    }
  }
}
