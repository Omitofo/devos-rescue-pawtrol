/**
 * Public product catalogue — WP-08.
 */

import { createClient } from "@/lib/supabase/server";
import type { Product } from "./types";

export async function listActiveProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, slug, name, description, price_cents, currency, image_url, is_active"
    )
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("listActiveProducts", error.message);
    return [];
  }
  return (data ?? []) as Product[];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, slug, name, description, price_cents, currency, image_url, is_active"
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;
  return data as Product;
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, slug, name, description, price_cents, currency, image_url, is_active"
    )
    .in("id", ids)
    .eq("is_active", true);

  if (error) return [];
  return (data ?? []) as Product[];
}

export function formatMoney(cents: number, currency = "EUR"): string {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}
