"use server";

/**
 * Update organisation public profile / Contact / CTA — J-05.
 * Gated by elevated re-auth window (same as animal mutations).
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireOrgMember } from "@/lib/auth/session";
import { requireElevatedWindow } from "@/lib/auth/elevated";
import { logger } from "@/lib/logger";

export type ProfileResult =
  | { ok: true }
  | { ok: false; error: string; code?: "ELEVATED_REAUTH_REQUIRED" };

export async function updateOrgProfile(
  formData: FormData
): Promise<ProfileResult> {
  const user = await requireOrgMember();
  if (!user.orgId) {
    return { ok: false, error: "No organisation linked to this account." };
  }

  try {
    await requireElevatedWindow();
  } catch {
    return {
      ok: false,
      error: "Elevated re-authentication required.",
      code: "ELEVATED_REAUTH_REQUIRED",
    };
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { ok: false, error: "Name is required." };
  }

  const payload = {
    name,
    description: emptyToNull(formData.get("description")),
    website_url: emptyToNull(formData.get("website_url")),
    public_email: emptyToNull(formData.get("public_email")),
    public_phone: emptyToNull(formData.get("public_phone")),
    cta_text: emptyToNull(formData.get("cta_text")),
    country_code: emptyToNull(formData.get("country_code"))?.toUpperCase() ?? null,
    subdivision: emptyToNull(formData.get("subdivision")),
    city: emptyToNull(formData.get("city")),
    logo_url: emptyToNull(formData.get("logo_url")),
  };

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update(payload)
    .eq("id", user.orgId);

  if (error) {
    logger.error("workspace.profile_update_failed", { orgId: user.orgId }, error);
    return { ok: false, error: error.message };
  }

  logger.info("workspace.profile_updated", { orgId: user.orgId });

  // Public pages that show org data
  revalidatePath("/workspace/profile");
  revalidatePath(`/organizations`);
  revalidatePath("/");

  // Revalidate org public profile by slug if we can load it
  const { data: org } = await supabase
    .from("organizations")
    .select("slug")
    .eq("id", user.orgId)
    .maybeSingle();
  if (org?.slug) {
    revalidatePath(`/organizations/${org.slug}`);
  }

  return { ok: true };
}

function emptyToNull(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim();
  return s.length ? s : null;
}
