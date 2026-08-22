/**
 * Admin Console data access — WP-07.
 * Platform staff only (RLS: is_platform_admin).
 */

import { createClient } from "@/lib/supabase/server";

export type AdminOrg = {
  id: string;
  name: string;
  slug: string;
  status: string;
  country_code: string | null;
  city: string | null;
  public_email: string | null;
  created_at: string;
};

export type AdminOrgDetail = AdminOrg & {
  description: string | null;
  public_phone: string | null;
  cta_text: string | null;
  website_url: string | null;
  verification_notes: string | null;
};

export type AdminLead = {
  id: string;
  name: string | null;
  email: string;
  organization_name: string | null;
  country_code: string | null;
  message: string | null;
  status: string;
  created_at: string;
};

export type AdminInterest = {
  id: string;
  animal_id: string | null;
  org_id: string | null;
  created_at: string;
};

export type AdminQuota = {
  org_id: string;
  max_active_animals: number;
  active_animals_count: number;
  max_storage_bytes: number;
  storage_bytes_used: number;
  max_animal_cud_per_day?: number;
  animal_cud_today?: number;
  max_image_uploads_per_day?: number;
  image_uploads_today?: number;
  max_images_per_animal?: number;
};

export async function listAllOrganizations(): Promise<AdminOrg[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select(
      "id, name, slug, status, country_code, city, public_email, created_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listAllOrganizations", error.message);
    return [];
  }
  return (data ?? []) as AdminOrg[];
}

export async function getOrganizationAdmin(
  id: string
): Promise<AdminOrgDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select(
      `id, name, slug, status, country_code, city, public_email, created_at,
       description, public_phone, cta_text, website_url, verification_notes`
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data as AdminOrgDetail;
}

export async function getOrgQuota(orgId: string): Promise<AdminQuota | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organization_quotas")
    .select(
      "org_id, max_active_animals, active_animals_count, max_storage_bytes, storage_bytes_used, max_animal_cud_per_day, animal_cud_today, max_image_uploads_per_day, image_uploads_today, max_images_per_animal"
    )
    .eq("org_id", orgId)
    .maybeSingle();
  return (data as AdminQuota) ?? null;
}

export async function listLeads(limit = 20): Promise<AdminLead[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select(
      "id, name, email, organization_name, country_code, message, status, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as AdminLead[];
}

export async function listRecentInterest(limit = 15): Promise<AdminInterest[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("interest_events")
    .select("id, animal_id, org_id, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as AdminInterest[];
}

export async function countPublishedAnimals(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("animals")
    .select("id", { count: "exact", head: true })
    .eq("status", "published")
    .is("deleted_at", null);
  return count ?? 0;
}
