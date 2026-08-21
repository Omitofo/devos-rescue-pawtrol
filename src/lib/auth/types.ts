/**
 * Auth types — WP-03.
 *
 * Roles match the Postgres enum public.app_role (WP-02).
 * Claims are read from JWT app_metadata (set when provisioning users).
 */

export type AppRole = "platform_admin" | "platform_moderator" | "org_user";

export type AuthUser = {
  id: string;
  email: string | undefined;
  role: AppRole | null;
  orgId: string | null;
};

/** Default elevated re-auth window for org mutations (minutes). */
export const ELEVATED_WINDOW_MINUTES = 15;

/** Cookie name that stores the elevated-window expiry (unix ms). */
export const ELEVATED_COOKIE = "rp_elevated_until";
