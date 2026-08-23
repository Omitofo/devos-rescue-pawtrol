"use server";

/**
 * Admin provisioning — expand WP-07 / J-07 / FR-07.
 *
 * Only platform staff. Creates organization rows and optionally an org_user
 * Auth account (no self-registration). Service role is required for
 * auth.admin.createUser and stays server-only (NFR-02).
 *
 * Form action returns Promise<void>: errors redirect with ?error=, success
 * redirects to the new organisation page.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { requirePlatformStaff } from "@/lib/auth/session";
import { logger } from "@/lib/logger";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function fail(message: string): never {
  redirect(
    `/admin/organizations/new?error=${encodeURIComponent(message)}`
  );
}

export async function provisionOrganization(
  formData: FormData
): Promise<void> {
  await requirePlatformStaff();

  const name = String(formData.get("name") ?? "").trim();
  const slugRaw = String(formData.get("slug") ?? "").trim();
  const slug = slugify(slugRaw || name);
  const status = String(formData.get("status") ?? "active");
  const country_code =
    String(formData.get("country_code") ?? "").trim().toUpperCase() || null;
  const city = String(formData.get("city") ?? "").trim() || null;
  const public_email =
    String(formData.get("public_email") ?? "").trim() || null;
  const public_phone =
    String(formData.get("public_phone") ?? "").trim() || null;
  const cta_text = String(formData.get("cta_text") ?? "").trim() || null;
  const description =
    String(formData.get("description") ?? "").trim() || null;

  const createUser = formData.get("create_user") === "on";
  const userEmail = String(formData.get("user_email") ?? "")
    .trim()
    .toLowerCase();
  const userPassword = String(formData.get("user_password") ?? "");
  const userDisplayName =
    String(formData.get("user_display_name") ?? "").trim() || name;

  if (!name || !slug) {
    fail("Name and slug are required.");
  }

  if (createUser) {
    if (!userEmail.includes("@") || userPassword.length < 8) {
      fail("Org user needs a valid email and password (min 8 characters).");
    }
  }

  let supabase;
  try {
    supabase = createServiceClient();
  } catch {
    fail("SUPABASE_SERVICE_ROLE_KEY is required for provisioning.");
  }
  if (!supabase) {
    fail("SUPABASE_SERVICE_ROLE_KEY is required for provisioning.");
  }

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name,
      slug,
      status:
        status === "pending_verification" ||
        status === "active" ||
        status === "suspended" ||
        status === "archived"
          ? status
          : "active",
      country_code,
      city,
      public_email,
      public_phone,
      cta_text,
      description,
    })
    .select("id")
    .single();

  if (orgError || !org) {
    logger.error("admin.provision_org_failed", { slug }, orgError);
    fail(orgError?.message ?? "Could not create organisation.");
  }

  let userId: string | undefined;

  if (createUser) {
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: userEmail,
        password: userPassword,
        email_confirm: true,
        app_metadata: {
          role: "org_user",
          org_id: org.id,
        },
        user_metadata: {
          display_name: userDisplayName,
        },
      });

    if (authError || !authData.user) {
      logger.error("admin.provision_user_failed", { userEmail }, authError);
      fail(
        `Organisation created (${org.id}) but user failed: ${authError?.message ?? "unknown"}. Create the user manually and set app_metadata.`
      );
    }

    userId = authData.user.id;

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: userId,
      role: "org_user",
      org_id: org.id,
      email: userEmail,
      display_name: userDisplayName,
    });

    if (profileError) {
      logger.error("admin.provision_profile_failed", { userId }, profileError);
      fail(`User created but profile failed: ${profileError.message}`);
    }
  }

  logger.info("admin.provision_ok", { orgId: org.id, userId });
  revalidatePath("/admin");
  redirect(`/admin/organizations/${org.id}`);
}
