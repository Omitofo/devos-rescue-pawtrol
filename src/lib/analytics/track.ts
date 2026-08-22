"use server";

/**
 * Day-one product analytics — WP-11 (FR-17).
 *
 * All inserts are best-effort: never throw to the caller.
 * No PII. RLS allows anyone to INSERT; only platform staff can SELECT.
 *
 * Event types (enum analytics_event_type):
 *   interest_cta | animal_view | org_view | search_filter
 *   product_view | add_to_cart | checkout_started | order_completed
 *
 * interest_cta is still written from recordInterestEvent (WP-05).
 * checkout_started / order_completed already written in shop + Stripe webhook.
 */

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export type AnalyticsEventType =
  | "interest_cta"
  | "animal_view"
  | "org_view"
  | "search_filter"
  | "product_view"
  | "add_to_cart"
  | "checkout_started"
  | "order_completed";

export type TrackPayload = {
  event_type: AnalyticsEventType;
  animal_id?: string | null;
  org_id?: string | null;
  product_id?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Fire-and-forget analytics insert.
 * Safe to call from Server Components and Server Actions.
 */
export async function trackEvent(payload: TrackPayload): Promise<void> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("analytics_events").insert({
      event_type: payload.event_type,
      animal_id: payload.animal_id ?? null,
      org_id: payload.org_id ?? null,
      product_id: payload.product_id ?? null,
      metadata: payload.metadata ?? {},
    });
    if (error) {
      logger.warn("analytics.track_failed", {
        event_type: payload.event_type,
        message: error.message,
      });
    }
  } catch (err) {
    logger.warn("analytics.track_exception", {
      event_type: payload.event_type,
    }, err);
  }
}
