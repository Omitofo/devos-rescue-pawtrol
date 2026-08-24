/**
 * Admin Console data access — WP-07 + analytics rankings.
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

/** Named entity ranking for admin analytics */
export type AnalyticsTopItem = {
  id: string;
  label: string;
  count: number;
};

export type AnalyticsDayBucket = {
  day: string;
  count: number;
};

export type AnalyticsFilterStat = {
  key: string;
  value: string;
  count: number;
};

function sinceDays(days: number): string {
  const since = new Date();
  since.setDate(since.getDate() - days);
  return since.toISOString();
}

/**
 * Top animals / orgs / products by event type (last N days).
 * Joins names when possible; falls back to short id.
 */
export async function getTopByEvent(opts: {
  eventType: string;
  idField: "animal_id" | "org_id" | "product_id";
  days?: number;
  limit?: number;
}): Promise<AnalyticsTopItem[]> {
  const days = opts.days ?? 7;
  const limit = opts.limit ?? 10;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("analytics_events")
    .select(opts.idField)
    .eq("event_type", opts.eventType)
    .gte("created_at", sinceDays(days))
    .not(opts.idField, "is", null)
    .limit(8000);

  if (error || !data) {
    console.error("getTopByEvent", opts.eventType, error?.message);
    return [];
  }

  const counts = new Map<string, number>();
  for (const row of data) {
    const id = (row as Record<string, string | null>)[opts.idField];
    if (!id) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  const ranked = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  if (ranked.length === 0) return [];

  const ids = ranked.map(([id]) => id);
  const labels = new Map<string, string>();

  if (opts.idField === "animal_id") {
    const { data: animals } = await supabase
      .from("animals")
      .select("id, name")
      .in("id", ids);
    for (const a of animals ?? []) {
      labels.set(a.id, a.name ?? a.id.slice(0, 8));
    }
  } else if (opts.idField === "org_id") {
    const { data: orgs } = await supabase
      .from("organizations")
      .select("id, name, slug")
      .in("id", ids);
    for (const o of orgs ?? []) {
      labels.set(o.id, o.name ?? o.slug ?? o.id.slice(0, 8));
    }
  } else if (opts.idField === "product_id") {
    const { data: products } = await supabase
      .from("products")
      .select("id, name")
      .in("id", ids);
    for (const p of products ?? []) {
      labels.set(p.id, p.name ?? p.id.slice(0, 8));
    }
  }

  return ranked.map(([id, count]) => ({
    id,
    label: labels.get(id) ?? `${id.slice(0, 8)}\u2026`,
    count,
  }));
}

/** Daily event totals for histogram (all types or one type). */
export async function getDailyEventCounts(opts?: {
  days?: number;
  eventType?: string;
}): Promise<AnalyticsDayBucket[]> {
  const days = opts?.days ?? 30;
  const supabase = await createClient();
  let q = supabase
    .from("analytics_events")
    .select("created_at, event_type")
    .gte("created_at", sinceDays(days))
    .limit(10000);

  if (opts?.eventType) {
    q = q.eq("event_type", opts.eventType);
  }

  const { data, error } = await q;
  if (error || !data) {
    console.error("getDailyEventCounts", error?.message);
    return [];
  }

  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, 0);
  }

  for (const row of data) {
    const key = String(row.created_at).slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }

  return Array.from(buckets.entries()).map(([day, count]) => ({ day, count }));
}

/**
 * Filter usage from search_filter metadata (discrete fields only).
 */
export async function getFilterUsageStats(
  days = 30,
  limit = 20
): Promise<AnalyticsFilterStat[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("analytics_events")
    .select("metadata")
    .eq("event_type", "search_filter")
    .gte("created_at", sinceDays(days))
    .limit(5000);

  if (error || !data) {
    console.error("getFilterUsageStats", error?.message);
    return [];
  }

  const counts = new Map<string, number>();
  const discrete = ["species", "age_group", "sex", "size", "country"];

  for (const row of data) {
    const meta = (row.metadata ?? {}) as Record<string, unknown>;
    for (const key of discrete) {
      const val = meta[key];
      if (val == null || val === "") continue;
      const k = `${key}=${String(val)}`;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    if (meta.q && String(meta.q).trim()) {
      counts.set("q=(text search)", (counts.get("q=(text search)") ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([combo, count]) => {
      const eq = combo.indexOf("=");
      return {
        key: eq >= 0 ? combo.slice(0, eq) : combo,
        value: eq >= 0 ? combo.slice(eq + 1) : "",
        count,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
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
