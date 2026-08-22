"use server";

/**
 * Admin mutations — WP-07 / WP-10.
 * Platform staff only. Status / quota / POD are privileged writes.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePlatformStaff } from "@/lib/auth/session";
import { logger } from "@/lib/logger";

export type AdminActionResult =
  | { ok: true }
  | { ok: false; error: string };

const ORG_STATUSES = [
  "pending_verification",
  "active",
  "suspended",
  "archived",
] as const;

export async function updateOrgStatus(
  orgId: string,
  status: string
): Promise<AdminActionResult> {
  await requirePlatformStaff();

  if (!ORG_STATUSES.includes(status as (typeof ORG_STATUSES)[number])) {
    return { ok: false, error: "Invalid status." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({ status })
    .eq("id", orgId);

  if (error) {
    logger.error("admin.org_status_failed", { orgId, status }, error);
    return { ok: false, error: error.message };
  }

  logger.info("admin.org_status_updated", { orgId, status });
  revalidatePath("/admin");
  revalidatePath(`/admin/organizations/${orgId}`);
  revalidatePath("/");
  return { ok: true };
}

/** Editable org quota limits (usage counters are system-managed). */
export type OrgQuotaLimits = {
  max_active_animals: number;
  max_animal_cud_per_day: number;
  max_image_uploads_per_day: number;
  max_images_per_animal: number;
  max_storage_bytes: number;
};

export async function updateOrgQuota(
  orgId: string,
  limits: OrgQuotaLimits
): Promise<AdminActionResult> {
  await requirePlatformStaff();

  const checks: [string, number, number][] = [
    ["max_active_animals", limits.max_active_animals, 1],
    ["max_animal_cud_per_day", limits.max_animal_cud_per_day, 1],
    ["max_image_uploads_per_day", limits.max_image_uploads_per_day, 1],
    ["max_images_per_animal", limits.max_images_per_animal, 1],
    ["max_storage_bytes", limits.max_storage_bytes, 1024 * 1024],
  ];
  for (const [name, value, min] of checks) {
    if (!Number.isFinite(value) || value < min) {
      return { ok: false, error: `Invalid ${name}.` };
    }
  }
  if (limits.max_images_per_animal > 20) {
    return { ok: false, error: "Max images per animal cannot exceed 20." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("organization_quotas")
    .update({
      max_active_animals: Math.floor(limits.max_active_animals),
      max_animal_cud_per_day: Math.floor(limits.max_animal_cud_per_day),
      max_image_uploads_per_day: Math.floor(limits.max_image_uploads_per_day),
      max_images_per_animal: Math.floor(limits.max_images_per_animal),
      max_storage_bytes: Math.floor(limits.max_storage_bytes),
    })
    .eq("org_id", orgId);

  if (error) {
    logger.error("admin.quota_update_failed", { orgId }, error);
    return { ok: false, error: error.message };
  }

  logger.info("admin.quota_updated", { orgId, ...limits });
  revalidatePath(`/admin/organizations/${orgId}`);
  revalidatePath("/admin");
  return { ok: true };
}

export async function updateLeadStatus(
  leadId: string,
  status: string
): Promise<AdminActionResult> {
  await requirePlatformStaff();

  const allowed = ["new", "contacted", "qualified", "rejected", "converted"];
  if (!allowed.includes(status)) {
    return { ok: false, error: "Invalid lead status." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", leadId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  return { ok: true };
}

const ORDER_STATUSES = [
  "pending_payment",
  "paid",
  "fulfilment_submitted",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

export async function updateOrderStatus(
  orderId: string,
  status: string
): Promise<AdminActionResult> {
  await requirePlatformStaff();

  if (!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) {
    return { ok: false, error: "Invalid order status." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) {
    logger.error("admin.order_status_failed", { orderId, status }, error);
    return { ok: false, error: error.message };
  }

  logger.info("admin.order_status_updated", { orderId, status });
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

/**
 * Admin-triggered POD fulfilment (WP-10).
 * Order must be paid; uses active provider (or mock).
 */
export async function submitOrderToPodAction(
  orderId: string
): Promise<AdminActionResult & { podOrderId?: string; provider?: string }> {
  await requirePlatformStaff();

  const { submitOrderToPod } = await import("@/lib/pod/submit");
  const result = await submitOrderToPod(orderId);

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return {
    ok: true,
    podOrderId: result.podOrderId,
    provider: result.provider,
  };
}
