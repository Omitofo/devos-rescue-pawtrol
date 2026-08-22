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

/** Day-one analytics counts by event_type (last N days) — WP-11 */
export type AnalyticsSummary = {
  event_type: string;
  count: number;
};

export async function getAnalyticsSummary(days = 7): Promise<AnalyticsSummary[]> {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceIso = since.toISOString();

  const { data, error } = await supabase
    .from("analytics_events")
    .select("event_type")
    .gte("created_at", sinceIso)
    .limit(5000);

  if (error || !data) {
    console.error("getAnalyticsSummary", error?.message);
    return [];
  }

  const counts = new Map<string, number>();
  for (const row of data) {
    const t = row.event_type as string;
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([event_type, count]) => ({ event_type, count }))
    .sort((a, b) => b.count - a.count);
}

/** Shop order row for admin list — ops visibility after WP-08/09 */
export type AdminOrder = {
  id: string;
  status: string;
  customer_email: string;
  customer_name: string | null;
  currency: string;
  total_cents: number;
  stripe_checkout_session_id: string | null;
  pod_provider: string | null;
  pod_order_id: string | null;
  pod_status: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminOrderItem = {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price_cents: number;
};

export type AdminOrderDetail = AdminOrder & {
  shipping_address: Record<string, unknown> | null;
  subtotal_cents: number;
  shipping_cents: number;
  stripe_payment_intent_id: string | null;
  metadata: Record<string, unknown> | null;
  items: AdminOrderItem[];
};

export async function listOrders(opts?: {
  status?: string;
  limit?: number;
}): Promise<AdminOrder[]> {
  const supabase = await createClient();
  let q = supabase
    .from("orders")
    .select(
      "id, status, customer_email, customer_name, currency, total_cents, stripe_checkout_session_id, pod_provider, pod_order_id, pod_status, created_at, updated_at"
    )
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 50);

  if (opts?.status) {
    q = q.eq("status", opts.status);
  }

  const { data, error } = await q;
  if (error) {
    console.error("listOrders", error.message);
    return [];
  }
  return (data ?? []) as AdminOrder[];
}

export async function getOrderAdmin(
  id: string
): Promise<AdminOrderDetail | null> {
  const supabase = await createClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `id, status, customer_email, customer_name, currency, total_cents,
       subtotal_cents, shipping_cents, shipping_address,
       stripe_checkout_session_id, stripe_payment_intent_id,
       pod_provider, pod_order_id, pod_status, metadata,
       created_at, updated_at`
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !order) return null;

  const { data: items } = await supabase
    .from("order_items")
    .select("id, product_id, product_name, quantity, unit_price_cents")
    .eq("order_id", id);

  return {
    ...(order as Omit<AdminOrderDetail, "items">),
    items: (items ?? []) as AdminOrderItem[],
  };
}

export async function countOrdersByStatus(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("status")
    .limit(2000);

  if (error || !data) return {};
  const counts: Record<string, number> = {};
  for (const row of data) {
    const s = row.status as string;
    counts[s] = (counts[s] ?? 0) + 1;
  }
  return counts;
}
