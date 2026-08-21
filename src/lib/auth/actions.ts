"use server";

/**
 * Auth server actions — WP-03 (+ org password for local/dev reliability).
 *
 * org_user  → Email OTP (preferred) or email + password
 * platform_* → Email + password
 *
 * Password login for org_user also opens the elevated window so workspace
 * mutations work without a second OTP when email is rate-limited.
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
      shouldCreateUser: false,
    },
  });

  if (error) {
    logger.warn("auth.org_otp_request_failed", {
      email: normalised,
      message: error.message,
    });

    const msg = error.message.toLowerCase();
    if (msg.includes("rate limit") || msg.includes("email rate")) {
      return {
        ok: false,
        error:
          "Email rate limit reached. Use the Password tab, or wait about an hour.",
      };
    }

    return {
      ok: false,
      error: "Could not send code. Check the email or contact the platform team.",
    };
  }

  logger.info("auth.org_otp_requested", { email: normalised });
  return { ok: true, message: "Check your email for the one-time code." };
}

/**
 * Verify Email OTP and open elevated window.
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
    logger.warn("auth.org_otp_verify_failed", {
      email: normalised,
      message: error?.message,
    });
    return { ok: false, error: "Invalid or expired code. Please try again." };
  }

  await grantElevatedWindow();

  logger.info("auth.org_otp_verified", {
    userId: data.user?.id,
    email: normalised,
  });

  return { ok: true, message: "Signed in." };
}

/**
 * Organization user: email + password.
 * Opens elevated window on success (same trust level as OTP for mutations).
 */
export async function orgPasswordLogin(
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
    logger.warn("auth.org_password_failed", {
      email: normalised,
      message: error?.message,
    });
    return { ok: false, error: "Invalid email or password." };
  }

  const role = data.user?.app_metadata?.role as string | undefined;
  if (role && role !== "org_user") {
    await supabase.auth.signOut();
    return {
      ok: false,
      error: "This account is not an organisation user. Use Admin sign in instead.",
    };
  }

  if (!data.user?.app_metadata?.org_id) {
    logger.warn("auth.org_password_missing_org", { userId: data.user?.id });
    // Still allow session; workspace will redirect if org_id missing
  }

  await grantElevatedWindow();

  logger.info("auth.org_password_ok", { userId: data.user?.id });
  return { ok: true, message: "Signed in." };
}

/**
 * Platform staff: email + password.
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
    logger.warn("auth.admin_login_failed", {
      email: normalised,
      message: error?.message,
    });
    return { ok: false, error: "Invalid credentials." };
  }

  const role = data.user?.app_metadata?.role as string | undefined;
  if (role && role !== "platform_admin" && role !== "platform_moderator") {
    await supabase.auth.signOut();
    return {
      ok: false,
      error: "This account is not authorised for the admin console.",
    };
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
