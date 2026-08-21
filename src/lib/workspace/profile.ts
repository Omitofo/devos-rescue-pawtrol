/**
 * Org profile data + mutations — workspace (J-05).
 * Sensitive public fields require elevated re-auth window.
 */

import { createClient } from "@/lib/supabase/server";

export type OrgProfile = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website_url: string | null;
  public_email: string | null;
  public_phone: string | null;
  cta_text: string | null;
  country_code: string | null;
  subdivision: string | null;
  city: string | null;
  logo_url: string | null;
};

export async function getOwnOrgProfile(orgId: string): Promise<OrgProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select(
      `id, name, slug, description, website_url, public_email, public_phone,
       cta_text, country_code, subdivision, city, logo_url`
    )
    .eq("id", orgId)
    .maybeSingle();

  if (error || !data) return null;
  return data as OrgProfile;
}
