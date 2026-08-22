/**
 * Quota & Rate Guard — WP-13 (FR-11, NFR-06).
 *
 * Server-side helpers that call SECURITY DEFINER RPCs for atomic counter
 * updates. Org members only have SELECT on organization_quotas; all writes
 * go through these functions.
 *
 * Active animal = status in ('published', 'pending') and deleted_at IS NULL.
 */

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export type QuotaResult =
  | { ok: true; [key: string]: unknown }
  | { ok: false; error: string; code?: string };

export type QuotaSnapshot = {
  ok: true;
  max_active_animals: number;
  active_animals_count: number;
  max_animal_cud_per_day: number;
  animal_cud_today: number;
  max_image_uploads_per_day: number;
  image_uploads_today: number;
  max_storage_bytes: number;
  storage_bytes_used: number;
  max_image_bytes: number;
  max_images_per_animal: number;
  usage_reset_date: string;
};

function parseRpc(data: unknown): QuotaResult {
  if (!data || typeof data !== "object") {
    return { ok: false, error: "Unexpected quota response.", code: "QUOTA_RPC" };
  }
  const row = data as Record<string, unknown>;
  if (row.ok === true) return { ok: true, ...row };
  return {
    ok: false,
    error: String(row.error ?? "Quota check failed."),
    code: row.code ? String(row.code) : undefined,
  };
}

/** True if status counts toward the active-animal quota. */
export function isActiveAnimalStatus(status: string | null | undefined): boolean {
  return status === "published" || status === "pending";
}

/**
 * Consume one animal CUD against the daily limit.
 * Call before create / update / soft-delete of an animal.
 */
export async function consumeAnimalCud(orgId: string): Promise<QuotaResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("quota_consume_animal_cud", {
    p_org_id: orgId,
  });
  if (error) {
    logger.error("quota.cud_rpc_failed", { orgId }, error);
    return { ok: false, error: error.message, code: "QUOTA_RPC" };
  }
  const result = parseRpc(data);
  if (!result.ok) {
    logger.warn("quota.cud_blocked", { orgId, code: result.code });
  }
  return result;
}

/**
 * Reserve one active-animal slot when a listing becomes published/pending.
 */
export async function reserveActiveAnimal(orgId: string): Promise<QuotaResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("quota_reserve_active_animal", {
    p_org_id: orgId,
  });
  if (error) {
    logger.error("quota.reserve_rpc_failed", { orgId }, error);
    return { ok: false, error: error.message, code: "QUOTA_RPC" };
  }
  const result = parseRpc(data);
  if (!result.ok) {
    logger.warn("quota.active_blocked", { orgId, code: result.code });
  }
  return result;
}

/**
 * Release one active-animal slot when leaving published/pending.
 */
export async function releaseActiveAnimal(orgId: string): Promise<QuotaResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("quota_release_active_animal", {
    p_org_id: orgId,
  });
  if (error) {
    logger.error("quota.release_rpc_failed", { orgId }, error);
    return { ok: false, error: error.message, code: "QUOTA_RPC" };
  }
  return parseRpc(data);
}

/**
 * Check daily upload + org storage, then consume.
 * Returns max_images_per_animal from the org row for per-animal checks.
 */
export async function consumeImageUpload(
  orgId: string,
  sizeBytes: number
): Promise<QuotaResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("quota_consume_image_upload", {
    p_org_id: orgId,
    p_size_bytes: sizeBytes,
  });
  if (error) {
    logger.error("quota.upload_rpc_failed", { orgId }, error);
    return { ok: false, error: error.message, code: "QUOTA_RPC" };
  }
  const result = parseRpc(data);
  if (!result.ok) {
    logger.warn("quota.upload_blocked", { orgId, code: result.code, sizeBytes });
  }
  return result;
}

/** Release storage bytes after media soft-delete. */
export async function releaseStorage(
  orgId: string,
  sizeBytes: number
): Promise<QuotaResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("quota_release_storage", {
    p_org_id: orgId,
    p_size_bytes: sizeBytes,
  });
  if (error) {
    logger.error("quota.release_storage_rpc_failed", { orgId }, error);
    return { ok: false, error: error.message, code: "QUOTA_RPC" };
  }
  return parseRpc(data);
}

/** Snapshot for workspace UI. */
export async function getQuotaSnapshot(
  orgId: string
): Promise<QuotaSnapshot | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("quota_snapshot", {
    p_org_id: orgId,
  });
  if (error || !data || typeof data !== "object") {
    logger.error("quota.snapshot_failed", { orgId }, error);
    return null;
  }
  const row = data as Record<string, unknown>;
  if (row.ok !== true) return null;
  return row as unknown as QuotaSnapshot;
}
