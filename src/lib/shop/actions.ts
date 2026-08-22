"use server";

/**
 * Shop server actions — WP-08 + WP-09.
 *
 * Guest-only; no auth required (FR-13).
 * WP-09: after creating a pending_payment order, create a Stripe Checkout
 * Session and redirect the guest to Stripe's hosted payment page when keys
 * are configured. Without Stripe keys the order stays pending_payment and
 * the confirmation page explains how to pay later.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  addToCart,
  setCartQuantity,
  getCartLines,
  clearCart,
  cartSubtotalCents,
} from "./cart";
import { logger } from "@/lib/logger";
import { createCheckoutSessionForOrder } from "@/lib/stripe/checkout";
import { isStripeConfigured } from "@/lib/stripe/server";

export type ShopResult =
  | { ok: true; orderId?: string }
  | { ok: false; error: string };

export async function addToCartAction(productId: string, quantity = 1) {
  await addToCart(productId, quantity);
  revalidatePath("/shop");
  revalidatePath("/shop/cart");
}

export async function updateCartQuantityAction(
  productId: string,
  quantity: number
) {
  await setCartQuantity(productId, quantity);
  revalidatePath("/shop/cart");
}

/**
 * Create a pending order from the guest cart, then (when Stripe is configured)
 * open a Checkout Session and redirect to Stripe.
 *
 * Used as a form action → returns Promise<void>; uses redirect() for control flow.
 *
 * Flow (FR-13 / FR-14):
 * 1. Validate address + cart
 * 2. Insert order + order_items via service role (RLS blocks public inserts)
 * 3. Best-effort analytics: checkout_started
 * 4. Clear cart cookie
 * 5. If Stripe configured → Checkout Session → redirect to session.url
 * 6. Else → redirect to order confirmation (pending_payment)
 */
export async function placeGuestOrder(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const line1 = String(formData.get("line1") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const postal = String(formData.get("postal") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim().toUpperCase();

  if (
    !email.includes("@") ||
    !name ||
    !line1 ||
    !city ||
    !postal ||
    country.length !== 2
  ) {
    logger.warn("shop.checkout_validation_failed", {});
    redirect("/shop/checkout");
  }

  const lines = await getCartLines();
  if (lines.length === 0) {
    redirect("/shop/cart");
  }

  const subtotal = cartSubtotalCents(lines);
  const shipping = subtotal >= 5000 ? 0 : 499; // simple flat rate under €50
  const total = subtotal + shipping;
  const currency = lines[0]?.product.currency ?? "EUR";

  // Service role needed: guests cannot insert into orders under RLS
  // (only platform staff policies exist). Use service client for trusted server write.
  let supabase;
  try {
    supabase = createServiceClient();
  } catch {
    // Fallback: try user client (will fail RLS unless policies allow — documented)
    supabase = await createClient();
  }

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      status: "pending_payment",
      customer_email: email,
      customer_name: name,
      shipping_address: { line1, city, postal, country },
      currency,
      subtotal_cents: subtotal,
      shipping_cents: shipping,
      total_cents: total,
    })
    .select("id")
    .single();

  if (error || !order) {
    logger.error("shop.order_create_failed", { email }, error);
    // Cannot return structured error from form action cleanly; send to cart with log.
    redirect("/shop/cart");
  }

  const items = lines.map((line) => ({
    order_id: order.id,
    product_id: line.productId,
    product_name: line.product.name,
    quantity: line.quantity,
    unit_price_cents: line.product.price_cents,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(items);
  if (itemsError) {
    logger.error("shop.order_items_failed", { orderId: order.id }, itemsError);
    redirect("/shop/cart");
  }

  // Analytics (best-effort) — checkout_started
  await supabase.from("analytics_events").insert({
    event_type: "checkout_started",
    metadata: { order_id: order.id },
  });

  await clearCart();
  logger.info("shop.order_created", { orderId: order.id, total });

  revalidatePath("/shop/cart");

  // WP-09: attempt Stripe Checkout when keys are present.
  if (isStripeConfigured()) {
    const checkout = await createCheckoutSessionForOrder({
      orderId: order.id,
      customerEmail: email,
      currency,
      shippingCents: shipping,
      lines: items.map((i) => ({
        product_name: i.product_name,
        quantity: i.quantity,
        unit_price_cents: i.unit_price_cents,
      })),
    });

    if (checkout.ok) {
      // Persist session id for webhook correlation / admin visibility.
      await supabase
        .from("orders")
        .update({ stripe_checkout_session_id: checkout.sessionId })
        .eq("id", order.id);

      redirect(checkout.url);
    }

    // Checkout creation failed — fall through to confirmation page with pending status.
    logger.warn("shop.checkout_fallback_pending", {
      orderId: order.id,
      reason: checkout.error,
    });
  }

  redirect(`/shop/order/${order.id}`);
}

/**
 * Re-open Stripe Checkout for an existing pending_payment order.
 * Used from the order confirmation page when the guest cancelled or
 * Stripe was not configured at order time.
 */
export async function payPendingOrder(orderId: string): Promise<ShopResult> {
  if (!orderId || !/^[0-9a-f-]{36}$/i.test(orderId)) {
    return { ok: false, error: "Invalid order id." };
  }

  if (!isStripeConfigured()) {
    return {
      ok: false,
      error: "Stripe is not configured. Set STRIPE_SECRET_KEY to enable payment.",
    };
  }

  let supabase;
  try {
    supabase = createServiceClient();
  } catch {
    return { ok: false, error: "Service role not available." };
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, status, customer_email, currency, shipping_cents, total_cents"
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error || !order) {
    return { ok: false, error: "Order not found." };
  }

  if (order.status !== "pending_payment") {
    return {
      ok: false,
      error: `Order is already ${order.status}; payment is not required.`,
    };
  }

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("product_name, quantity, unit_price_cents")
    .eq("order_id", orderId);

  if (itemsError || !items || items.length === 0) {
    return { ok: false, error: "Order has no line items." };
  }

  const checkout = await createCheckoutSessionForOrder({
    orderId: order.id,
    customerEmail: order.customer_email,
    currency: order.currency,
    shippingCents: order.shipping_cents ?? 0,
    lines: items.map((i) => ({
      product_name: i.product_name,
      quantity: i.quantity,
      unit_price_cents: i.unit_price_cents,
    })),
  });

  if (!checkout.ok) {
    return { ok: false, error: checkout.error };
  }

  await supabase
    .from("orders")
    .update({ stripe_checkout_session_id: checkout.sessionId })
    .eq("id", order.id);

  redirect(checkout.url);
}
