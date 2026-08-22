"use server";

/**
 * Submit a paid order to the active POD provider — WP-10.
 *
 * - Loads order + items (service role)
 * - Calls provider.submitOrder
 * - On success: status → fulfilment_submitted, store pod_* fields
 */

import { createServiceClient } from "@/lib/supabase/server";
import { getPodProvider } from "./index";
import type { PodSubmitResult, PodShippingAddress } from "./types";
import { logger } from "@/lib/logger";

export type SubmitToPodResult =
  | { ok: true; provider: string; podOrderId: string }
  | { ok: false; error: string };

export async function submitOrderToPod(
  orderId: string
): Promise<SubmitToPodResult> {
  const supabase = createServiceClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `id, status, customer_email, customer_name, currency, shipping_address,
       pod_order_id, pod_provider`
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error || !order) {
    return { ok: false, error: "Order not found." };
  }

  if (order.status !== "paid" && order.status !== "fulfilment_submitted") {
    return {
      ok: false,
      error: `Order must be paid before POD submit (current: ${order.status}).`,
    };
  }

  if (order.pod_order_id && order.status === "fulfilment_submitted") {
    return {
      ok: true,
      provider: order.pod_provider ?? "unknown",
      podOrderId: order.pod_order_id,
    };
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("product_name, quantity, unit_price_cents, metadata")
    .eq("order_id", orderId);

  if (!items?.length) {
    return { ok: false, error: "Order has no line items." };
  }

  const addr = (order.shipping_address ?? {}) as Record<string, string>;
  const shipping: PodShippingAddress = {
    name: order.customer_name ?? undefined,
    email: order.customer_email,
    line1: addr.line1,
    city: addr.city,
    postal: addr.postal,
    country: addr.country,
  };

  const provider = getPodProvider();
  const result: PodSubmitResult = await provider.submitOrder({
    orderId,
    currency: order.currency ?? "EUR",
    shipping,
    items: items.map((i) => ({
      productName: i.product_name,
      quantity: i.quantity,
      unitPriceCents: i.unit_price_cents,
      providerSku:
        (i.metadata as { provider_sku?: string } | null)?.provider_sku ?? null,
      metadata: (i.metadata as Record<string, unknown>) ?? {},
    })),
  });

  if (!result.ok) {
    logger.error("pod.submit_failed", {
      orderId,
      provider: result.provider,
      error: result.error,
    });
    return { ok: false, error: result.error };
  }

  const { error: updErr } = await supabase
    .from("orders")
    .update({
      status: "fulfilment_submitted",
      pod_provider: result.provider,
      pod_order_id: result.podOrderId,
      pod_status: result.podStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (updErr) {
    logger.error("pod.order_update_failed", { orderId }, updErr);
    return { ok: false, error: updErr.message };
  }

  logger.info("pod.submit_ok", {
    orderId,
    provider: result.provider,
    podOrderId: result.podOrderId,
  });

  return {
    ok: true,
    provider: result.provider,
    podOrderId: result.podOrderId,
  };
}
