/**
 * Public animal data access — WP-05.
 *
 * Only published animals with deleted_at IS NULL are returned.
 * Uses the anon server client; RLS enforces the same rules.
 */

import { createClient } from "@/lib/supabase/server";

export type AnimalCard = {
  id: string;
  name: string;
  slug: string | null;
  species: string;
  breed: string | null;
  age_group: string | null;
  sex: string | null;
  size: string | null;
  summary: string | null;
  country_code: string | null;
  city: string | null;
  cover_image_url: string | null;
  org_id: string;
  organizations: { name: string; slug: string } | null;
};

export type AnimalDetail = AnimalCard & {
  description: string | null;
  special_needs: string | null;
  compatibility: Record<string, boolean> | null;
  subdivision: string | null;
  status: string;
  published_at: string | null;
  organizations: {
    id: string;
    name: string;
    slug: string;
    cta_text: string | null;
    public_email: string | null;
    public_phone: string | null;
    website_url: string | null;
    city: string | null;
    country_code: string | null;
  } | null;
};

export type AnimalFilters = {
  q?: string;
  species?: string;
  age_group?: string;
  sex?: string;
  size?: string;
  country?: string;
};

function normaliseOrg<T extends { organizations: unknown }>(row: T) {
  return {
    ...row,
    organizations: Array.isArray(row.organizations)
      ? row.organizations[0] ?? null
      : row.organizations,
  };
}

/**
 * List published animals for the public grid.
 */
export async function listPublishedAnimals(
  filters: AnimalFilters = {}
): Promise<AnimalCard[]> {
  const supabase = await createClient();

  let query = supabase
    .from("animals")
    .select(
      `
      id, name, slug, species, breed, age_group, sex, size,
      summary, country_code, city, cover_image_url, org_id,
      organizations ( name, slug )
    `
    )
    .eq("status", "published")
    .is("deleted_at", null)
    .order("published_at", { ascending: false });

  if (filters.species) query = query.eq("species", filters.species);
  if (filters.age_group) query = query.eq("age_group", filters.age_group);
  if (filters.sex) query = query.eq("sex", filters.sex);
  if (filters.size) query = query.eq("size", filters.size);
  if (filters.country) query = query.eq("country_code", filters.country);

  if (filters.q) {
    const term = `%${filters.q.trim()}%`;
    query = query.or(
      `name.ilike.${term},breed.ilike.${term},summary.ilike.${term},city.ilike.${term}`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("listPublishedAnimals", error.message);
    return [];
  }

  return (data ?? []).map((row) => normaliseOrg(row)) as AnimalCard[];
}

/**
 * Get a single published animal by id.
 */
export async function getPublishedAnimal(
  id: string
): Promise<AnimalDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("animals")
    .select(
      `
      id, name, slug, species, breed, age_group, sex, size,
      summary, description, special_needs, compatibility,
      country_code, subdivision, city, cover_image_url,
      org_id, status, published_at,
      organizations (
        id, name, slug, cta_text,
        public_email, public_phone, website_url,
        city, country_code
      )
    `
    )
    .eq("id", id)
    .eq("status", "published")
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) return null;

  return normaliseOrg(data) as AnimalDetail;
}

/**
 * Published animals belonging to one org (for org profile page).
 */
export async function listOrgPublishedAnimals(
  orgId: string
): Promise<AnimalCard[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("animals")
    .select(
      `
      id, name, slug, species, breed, age_group, sex, size,
      summary, country_code, city, cover_image_url, org_id,
      organizations ( name, slug )
    `
    )
    .eq("org_id", orgId)
    .eq("status", "published")
    .is("deleted_at", null)
    .order("published_at", { ascending: false });

  if (error) return [];

  return (data ?? []).map((row) => normaliseOrg(row)) as AnimalCard[];
}
