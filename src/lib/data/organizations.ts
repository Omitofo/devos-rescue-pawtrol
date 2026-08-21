/**
 * Public organization data access — WP-05.
 */

import { createClient } from "@/lib/supabase/server";

export type OrgPublic = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  public_email: string | null;
  public_phone: string | null;
  cta_text: string | null;
  country_code: string | null;
  subdivision: string | null;
  city: string | null;
};

export async function getActiveOrgBySlug(
  slug: string
): Promise<OrgPublic | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organizations")
    .select(
      `
      id, name, slug, description, logo_url, website_url,
      public_email, public_phone, cta_text,
      country_code, subdivision, city
    `
    )
    .eq("slug", slug)
    .eq("status", "active")
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) return null;
  return data as OrgPublic;
}
