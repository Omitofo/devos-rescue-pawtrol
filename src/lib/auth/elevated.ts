/**
 * Elevated re-auth window — WP-03.
 *
 * Every organization mutation (animal CUD, profile edit, media upload)
 * must occur inside a short window after the org_user re-authenticates
 * via Email OTP (target 15–20 min; we use 15 by default).
 *
 * Implementation: httpOnly cookie `rp_elevated_until` holding a unix-ms expiry.
 * Set after successful OTP verification; checked by server actions that mutate.
 *
 * Platform staff use MFA instead (handled separately in admin flows).
 */

import { cookies } from "next/headers";
import {
  ELEVATED_COOKIE,
  ELEVATED_WINDOW_MINUTES,
} from "./types";

/**
 * Mark the current session as elevated for ELEVATED_WINDOW_MINUTES.
 * Call after a successful org OTP verification.
 */
export async function grantElevatedWindow(
  minutes: number = ELEVATED_WINDOW_MINUTES
): Promise<void> {
  const store = await cookies();
  const until = Date.now() + minutes * 60 * 1000;
  store.set(ELEVATED_COOKIE, String(until), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: minutes * 60,
  });
}

/**
 * Clear the elevated window (e.g. on sign-out).
 */
export async function clearElevatedWindow(): Promise<void> {
  const store = await cookies();
  store.delete(ELEVATED_COOKIE);
}

/**
 * Returns true if the elevated window is still valid.
 */
export async function hasElevatedWindow(): Promise<boolean> {
  const store = await cookies();
  const raw = store.get(ELEVATED_COOKIE)?.value;
  if (!raw) return false;
  const until = Number(raw);
  if (Number.isNaN(until)) return false;
  return Date.now() < until;
}

/**
 * Remaining seconds in the elevated window, or 0 if expired/missing.
 */
export async function elevatedRemainingSeconds(): Promise<number> {
  const store = await cookies();
  const raw = store.get(ELEVATED_COOKIE)?.value;
  if (!raw) return 0;
  const until = Number(raw);
  if (Number.isNaN(until)) return 0;
  const remaining = Math.floor((until - Date.now()) / 1000);
  return remaining > 0 ? remaining : 0;
}

/**
 * Guard for org mutation server actions.
 * Throws a structured error if the elevated window is missing/expired
 * so the UI can prompt for OTP re-auth (journey E-08).
 */
export async function requireElevatedWindow(): Promise<void> {
  const ok = await hasElevatedWindow();
  if (!ok) {
    const err = new Error("ELEVATED_REAUTH_REQUIRED");
    err.name = "ElevatedReauthRequired";
    throw err;
  }
}
