/**
 * Organization workspace data access — WP-06.
 * Scoped to the authenticated org_user's org_id (RLS + app checks).
 */

import { createClient } from "@/lib/supabase/server";

export type WorkspaceAnimal = {
  id: string;
  name: string;
  slug: string | null;
  status: string;
  species: string;
  breed: string | null;
  age_group: string | null;
  sex: string | null;
  size: string | null;
  summary: string | null;
  description: string | null;
  special_needs: string | null;
  country_code: string | null;
  subdivision: string | null;
  city: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  updated_at: string;
};

export async function listOrgAnimals(orgId: string): Promise<WorkspaceAnimal[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("animals")
    .select(
      `id, name, slug, status, species, breed, age_group, sex, size,
       summary, description, special_needs, country_code, subdivision, city,
       cover_image_url, published_at, updated_at`
    )
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("listOrgAnimals", error.message);
    return [];
  }
  return (data ?? []) as WorkspaceAnimal[];
}

export async function getOrgAnimal(
  orgId: string,
  animalId: string
): Promise<WorkspaceAnimal | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("animals")
    .select(
      `id, name, slug, status, species, breed, age_group, sex, size,
       summary, description, special_needs, country_code, subdivision, city,
       cover_image_url, published_at, updated_at`
    )
    .eq("org_id", orgId)
    .eq("id", animalId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) return null;
  return data as WorkspaceAnimal;
}

export type AnimalWriteInput = {
  name: string;
  species: string;
  breed?: string;
  age_group?: string;
  sex?: string;
  size?: string;
  summary?: string;
  description?: string;
  special_needs?: string;
  country_code?: string;
  subdivision?: string;
  city?: string;
  cover_image_url?: string;
  status: "draft" | "published" | "pending" | "adopted" | "removed";
};
