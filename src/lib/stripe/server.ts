/**
 * Stripe server client — WP-09 (Checkout, payments & orders).
 *
 * FR-13 / FR-14: guest checkout with Stripe (core + wallets via Checkout).
 * Uses Stripe Checkout Session (hosted) for MVP — supports cards, Apple Pay,
 * Google Pay automatically when enabled in the Stripe Dashboard.
 *
 * Never import this module from Client Components (secret key).
 */

import Stripe from "stripe";

let stripeSingleton: Stripe | null = null;

/**
 * Returns a configured Stripe client, or null if STRIPE_SECRET_KEY is missing.
 * Callers must handle the null case (dev without keys, CI without secrets).
 */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;

  if (!stripeSingleton) {
    stripeSingleton = new Stripe(key, {
      // Pin to the version shipped with stripe@17 types.
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    });
  }
  return stripeSingleton;
}

/** True when Stripe secret key is present (payment path available). */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/**
 * Public site origin for success/cancel URLs.
 * Prefer NEXT_PUBLIC_SITE_URL; fall back to localhost in dev.
 */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  return "http://localhost:3000";
}
