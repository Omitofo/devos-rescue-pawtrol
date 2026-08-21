"use server";

/**
 * Auth server actions — WP-03.
 *
 * org_user  → Email OTP (login + elevated re-auth)
 * platform_* → Email + password (MFA to be enabled in Supabase dashboard)
 *
 * These actions never expose the service-role key (NFR-02).
 */

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { grantElevatedWindow, clearElevatedWindow } from "./elevated";
import { logger } from "@/lib/logger";

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

/**
 * Request an Email OTP for an organization user.
 * Supabase sends a 6–8 digit code (or magic link, depending on project config).
 */
export async function requestOrgOtp(email: string): Promise<ActionResult> {
  const normalised = email.trim().toLowerCase();
  if (!normalised || !normalised.includes("@")) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: normalised,
    options: {
      // Do not create users automatically — org accounts are admin-provisioned only (FR-07).
      shouldCreateUser: false,
    },
  });

  if (error) {
    logger.warn("auth.org_otp_request_failed", { email: normalised, message: error.message });
    // Generic message to avoid account enumeration
    return {
      ok: false,
      error: "Could not send code. Check the email or contact the platform team.",
    };
  }

  logger.info("auth.org_otp_requested", { email: normalised });
  return { ok: true, message: "Check your email for the one-time code." };
}

/**
 * Verify the Email OTP for an org user and open the elevated window.
 */
export async function verifyOrgOtp(
  email: string,
  token: string
): Promise<ActionResult> {
  const normalised = email.trim().toLowerCase();
  const code = token.trim();

  if (!normalised || !code) {
    return { ok: false, error: "Email and code are required." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email: normalised,
    token: code,
    type: "email",
  });

  if (error || !data.session) {
    logger.warn("auth.org_otp_verify_failed", { email: normalised, message: error?.message });
    return { ok: false, error: "Invalid or expired code. Please try again." };
  }

  // Open the elevated re-auth window for org mutations.
  await grantElevatedWindow();

  logger.info("auth.org_otp_verified", {
    userId: data.user?.id,
    email: normalised,
  });

  return { ok: true, message: "Signed in." };
}

/**
 * Platform staff: email + password sign-in.
 * MFA challenge (if enabled in Supabase) is handled by the client / dashboard settings.
 */
export async function adminPasswordLogin(
  email: string,
  password: string
): Promise<ActionResult> {
  const normalised = email.trim().toLowerCase();
  if (!normalised || !password) {
    return { ok: false, error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalised,
    password,
  });

  if (error || !data.session) {
    logger.warn("auth.admin_login_failed", { email: normalised, message: error?.message });
    return { ok: false, error: "Invalid credentials." };
  }

  // Soft check: prefer platform roles (claims set at provision time).
  const role = data.user?.app_metadata?.role as string | undefined;
  if (role && role !== "platform_admin" && role !== "platform_moderator") {
    // Not staff — sign out and reject
    await supabase.auth.signOut();
    return { ok: false, error: "This account is not authorised for the admin console." };
  }

  logger.info("auth.admin_login_ok", { userId: data.user?.id });
  return { ok: true, message: "Signed in." };
}

/**
 * Sign out and clear the elevated window.
 */
export async function signOut(redirectTo = "/"): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  await clearElevatedWindow();
  logger.info("auth.sign_out");
  redirect(redirectTo);
}
