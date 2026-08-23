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
import { trackEvent } from "@/lib/analytics/track";

export type ShopResult =
  | { ok: true; orderId?: string }
  | { ok: false; error: string };

export async function addToCartAction(productId: string, quantity = 1) {
  await addToCart(productId, quantity);
  await trackEvent({
    event_type: "add_to_cart",
    product_id: productId,
    metadata: { quantity },
  });
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
 * Guest checkout flow:
 * 1. Validate cart + contact fields
 * 2. Insert pending_payment order + items
 * 3. If Stripe configured → Checkout Session redirect
 * 4. Else → order confirmation page (pending payment message)
 */
export async function placeGuestOrder(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const line1 = String(formData.get("line1") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const postal = String(formData.get("postal") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim().toUpperCase();

  if (!email || !email.includes("@")) {
    redirect("/shop/checkout?error=email");
  }
  if (!name || !line1 || !city || !postal || country.length !== 2) {
    redirect("/shop/checkout?error=address");
  }

  const lines = await getCartLines();
  if (lines.length === 0) {
    redirect("/shop/cart");
  }

  const subtotal = cartSubtotalCents(lines);
  const shipping = subtotal >= 5000 ? 0 : 499;
  const total = subtotal + shipping;
  const currency = lines[0]?.product.currency ?? "EUR";

  const items = lines.map((l) => ({
    product_id: l.product.id,
    product_name: l.product.name,
    quantity: l.quantity,
    unit_price_cents: l.product.price_cents,
  }));

  const supabase = createServiceClient();

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      status: "pending_payment",
      customer_email: email,
      customer_name: name,
      shipping_address: {
        line1,
        city,
        postal,
        country,
      },
      currency,
      subtotal_cents: subtotal,
      shipping_cents: shipping,
      total_cents: total,
    })
    .select("id")
    .single();

  if (error || !order) {
    logger.error("shop.order_insert_failed", { email }, error);
    redirect("/shop/checkout?error=server");
  }

  const { error: itemsError } = await supabase.from("order_items").insert(
    items.map((i) => ({
      order_id: order.id,
      product_id: i.product_id,
      product_name: i.product_name,
      quantity: i.quantity,
      unit_price_cents: i.unit_price_cents,
    }))
  );

  if (itemsError) {
    logger.error("shop.order_items_failed", { orderId: order.id }, itemsError);
  }

  await supabase.from("analytics_events").insert({
    event_type: "checkout_started",
    metadata: { order_id: order.id },
  });

  await clearCart();
  logger.info("shop.order_created", { orderId: order.id, total });

  revalidatePath("/shop/cart");

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

    if (checkout.ok && checkout.url && checkout.sessionId) {
      await supabase
        .from("orders")
        .update({ stripe_checkout_session_id: checkout.sessionId })
        .eq("id", order.id);

      redirect(checkout.url);
    }

    logger.warn("shop.stripe_session_failed", {
      orderId: order.id,
      error: checkout.ok ? "missing_url" : checkout.error,
    });
  }

  redirect(`/shop/order/${order.id}`);
}

/**
 * Resume payment for an existing pending_payment order (order confirmation page).
 * Creates a Stripe Checkout Session when keys are present; otherwise returns a
 * clear error so production can ship without Stripe configured yet.
 */
export async function payPendingOrder(
  orderId: string
): Promise<ShopResult | void> {
  if (!orderId) {
    return { ok: false, error: "Missing order id." };
  }

  if (!isStripeConfigured()) {
    return {
      ok: false,
      error:
        "Card payment is not configured on this environment yet (missing Stripe keys). Your order is saved as pending payment.",
    };
  }

  const supabase = createServiceClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, status, customer_email, currency, shipping_cents, total_cents, order_items(product_name, quantity, unit_price_cents)"
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error || !order) {
    logger.error("shop.pay_order_not_found", { orderId }, error);
    return { ok: false, error: "Order not found." };
  }

  if (order.status !== "pending_payment") {
    return {
      ok: false,
      error: `This order cannot be paid (status: ${order.status}).`,
    };
  }

  const items = (order.order_items ?? []) as Array<{
    product_name: string;
    quantity: number;
    unit_price_cents: number;
  }>;

  if (items.length === 0) {
    return { ok: false, error: "Order has no line items." };
  }

  const checkout = await createCheckoutSessionForOrder({
    orderId: order.id,
    customerEmail: order.customer_email,
    currency: order.currency ?? "EUR",
    shippingCents: order.shipping_cents ?? 0,
    lines: items.map((i) => ({
      product_name: i.product_name,
      quantity: i.quantity,
      unit_price_cents: i.unit_price_cents,
    })),
  });

  if (checkout.ok && checkout.url && checkout.sessionId) {
    await supabase
      .from("orders")
      .update({ stripe_checkout_session_id: checkout.sessionId })
      .eq("id", order.id);

    redirect(checkout.url);
  }

  logger.warn("shop.pay_stripe_session_failed", {
    orderId: order.id,
    error: checkout.ok ? "missing_url" : checkout.error,
  });

  return {
    ok: false,
    error: checkout.ok
      ? "Could not start Stripe Checkout."
      : checkout.error,
  };
}
