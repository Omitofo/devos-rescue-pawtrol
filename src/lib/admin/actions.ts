"use server";

/**
 * Admin mutations — WP-07.
 * Platform staff only. Status / quota changes are privileged writes.
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

export async function updateOrgQuota(
  orgId: string,
  maxActiveAnimals: number
): Promise<AdminActionResult> {
  await requirePlatformStaff();

  if (!Number.isFinite(maxActiveAnimals) || maxActiveAnimals < 1) {
    return { ok: false, error: "Quota must be a positive number." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("organization_quotas")
    .update({ max_active_animals: maxActiveAnimals })
    .eq("org_id", orgId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/admin/organizations/${orgId}`);
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

/**
 * Manual order status transition (ops / pre-POD).
 * Stripe webhook owns pending_payment → paid; staff may advance fulfilment.
 */
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
