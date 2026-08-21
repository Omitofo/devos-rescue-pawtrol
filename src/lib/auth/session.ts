/**
 * Session & route-protection helpers — WP-03.
 *
 * All helpers are server-only (use createClient from @/lib/supabase/server).
 * They read role + org_id from JWT app_metadata, which must be set when
 * provisioning users (WP-07 Admin Console / manual seed for now).
 *
 * RLS already enforces tenant isolation using the same claims
 * (jwt_role / jwt_org_id helpers in the schema migration).
 */

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { AppRole, AuthUser } from "./types";

/**
 * Resolve the current authenticated user, or null if anonymous.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const meta = user.app_metadata ?? {};
  const role = (meta.role as AppRole | undefined) ?? null;
  const orgId = (meta.org_id as string | undefined) ?? null;

  return {
    id: user.id,
    email: user.email,
    role,
    orgId,
  };
}

/**
 * Require any authenticated user. Redirects to the appropriate login
 * if missing. Returns the AuthUser on success.
 */
export async function requireAuth(loginPath = "/auth/login"): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) redirect(loginPath);
  return user;
}

/**
 * Require one of the given roles. Redirects to login (or /) on failure.
 */
export async function requireRole(
  allowed: AppRole[],
  loginPath = "/auth/login"
): Promise<AuthUser> {
  const user = await requireAuth(loginPath);
  if (!user.role || !allowed.includes(user.role)) {
    redirect("/");
  }
  return user;
}

/**
 * Require an org_user who belongs to a specific org (or any org if orgId omitted).
 */
export async function requireOrgMember(orgId?: string): Promise<AuthUser> {
  const user = await requireRole(["org_user"]);
  if (!user.orgId) redirect("/auth/login");
  if (orgId && user.orgId !== orgId) redirect("/");
  return user;
}

/**
 * Require platform staff (admin or moderator).
 */
export async function requirePlatformStaff(): Promise<AuthUser> {
  return requireRole(["platform_admin", "platform_moderator"], "/auth/admin/login");
}
