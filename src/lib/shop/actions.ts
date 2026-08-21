"use server";

/**
 * Shop server actions — WP-08.
 * Guest-only; no auth required.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addToCart, setCartQuantity, getCartLines, clearCart, cartSubtotalCents } from "./cart";
import { logger } from "@/lib/logger";

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
 * Create a pending order from the guest cart.
 * Stripe PaymentIntent is deferred — order is stored as pending_payment.
 */
export async function placeGuestOrder(formData: FormData): Promise<ShopResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const line1 = String(formData.get("line1") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const postal = String(formData.get("postal") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim().toUpperCase();

  if (!email.includes("@") || !name || !line1 || !city || !postal || country.length !== 2) {
    return { ok: false, error: "Please fill in all required fields." };
  }

  const lines = await getCartLines();
  if (lines.length === 0) {
    return { ok: false, error: "Your cart is empty." };
  }

  const subtotal = cartSubtotalCents(lines);
  const shipping = subtotal >= 5000 ? 0 : 499; // simple flat rate under €50
  const total = subtotal + shipping;
  const currency = lines[0]?.product.currency ?? "EUR";

  // Service role needed: guests cannot insert into orders under RLS
  // (only platform staff policies exist). Use service client for trusted server write.
  const { createServiceClient } = await import("@/lib/supabase/server");
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
    return {
      ok: false,
      error:
        error?.message ??
        "Could not create order. Ensure SUPABASE_SERVICE_ROLE_KEY is set.",
    };
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
    return { ok: false, error: itemsError.message };
  }

  // Analytics (best-effort)
  await supabase.from("analytics_events").insert({
    event_type: "checkout_started",
    metadata: { order_id: order.id },
  });

  await clearCart();
  logger.info("shop.order_created", { orderId: order.id, total });

  revalidatePath("/shop/cart");
  redirect(`/shop/order/${order.id}`);
}
