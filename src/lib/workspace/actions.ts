"use server";

/**
 * Organization animal mutations — WP-06 + WP-13.
 *
 * Every write requires an active elevated re-auth window (J-04, E-08).
 * WP-13: daily CUD limit + active-animal capacity enforced via quota RPCs.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireOrgMember } from "@/lib/auth/session";
import { requireElevatedWindow } from "@/lib/auth/elevated";
import { logger } from "@/lib/logger";
import type { AnimalWriteInput } from "@/lib/data/workspace";
import {
  consumeAnimalCud,
  isActiveAnimalStatus,
  releaseActiveAnimal,
  reserveActiveAnimal,
} from "@/lib/quota/service";

export type MutationResult =
  | { ok: true; id?: string }
  | { ok: false; error: string; code?: "ELEVATED_REAUTH_REQUIRED" | string };

function parseInput(formData: FormData): AnimalWriteInput {
  const status = String(formData.get("status") ?? "draft") as AnimalWriteInput["status"];
  return {
    name: String(formData.get("name") ?? "").trim(),
    species: String(formData.get("species") ?? "dog").trim(),
    breed: String(formData.get("breed") ?? "").trim() || undefined,
    age_group: String(formData.get("age_group") ?? "").trim() || undefined,
    sex: String(formData.get("sex") ?? "").trim() || undefined,
    size: String(formData.get("size") ?? "").trim() || undefined,
    summary: String(formData.get("summary") ?? "").trim() || undefined,
    description: String(formData.get("description") ?? "").trim() || undefined,
    special_needs: String(formData.get("special_needs") ?? "").trim() || undefined,
    country_code: String(formData.get("country_code") ?? "").trim() || undefined,
    subdivision: String(formData.get("subdivision") ?? "").trim() || undefined,
    city: String(formData.get("city") ?? "").trim() || undefined,
    cover_image_url: String(formData.get("cover_image_url") ?? "").trim() || undefined,
    status: ["draft", "published", "pending", "adopted", "removed"].includes(status)
      ? status
      : "draft",
  };
}

async function guardMutation() {
  const user = await requireOrgMember();
  try {
    await requireElevatedWindow();
  } catch {
    return { user: null, error: "ELEVATED_REAUTH_REQUIRED" as const };
  }
  return { user, error: null };
}

export async function createAnimal(formData: FormData): Promise<MutationResult> {
  const { user, error } = await guardMutation();
  if (error || !user?.orgId) {
    return {
      ok: false,
      error: "Elevated re-authentication required.",
      code: "ELEVATED_REAUTH_REQUIRED",
    };
  }

  const input = parseInput(formData);
  if (!input.name || !input.species) {
    return { ok: false, error: "Name and species are required." };
  }

  // WP-13: daily CUD budget
  const cud = await consumeAnimalCud(user.orgId);
  if (!cud.ok) {
    return { ok: false, error: cud.error, code: cud.code };
  }

  // WP-13: active-animal capacity when creating already-published/pending
  if (isActiveAnimalStatus(input.status)) {
    const slot = await reserveActiveAnimal(user.orgId);
    if (!slot.ok) {
      return { ok: false, error: slot.error, code: slot.code };
    }
  }

  const supabase = await createClient();
  const row = {
    org_id: user.orgId,
    name: input.name,
    species: input.species,
    breed: input.breed ?? null,
    age_group: input.age_group ?? null,
    sex: input.sex ?? null,
    size: input.size ?? null,
    summary: input.summary ?? null,
    description: input.description ?? null,
    special_needs: input.special_needs ?? null,
    country_code: input.country_code ?? null,
    subdivision: input.subdivision ?? null,
    city: input.city ?? null,
    cover_image_url: input.cover_image_url ?? null,
    status: input.status,
    published_at: input.status === "published" ? new Date().toISOString() : null,
  };

  const { data, error: insertError } = await supabase
    .from("animals")
    .insert(row)
    .select("id")
    .single();

  if (insertError) {
    // Best-effort rollback of active slot if we reserved one
    if (isActiveAnimalStatus(input.status)) {
      await releaseActiveAnimal(user.orgId);
    }
    logger.error("workspace.animal_create_failed", { orgId: user.orgId }, insertError);
    return { ok: false, error: insertError.message };
  }

  logger.info("workspace.animal_created", { id: data.id, orgId: user.orgId });
  revalidatePath("/workspace");
  revalidatePath("/");
  redirect(`/workspace/animals/${data.id}/edit`);
}

export async function updateAnimal(
  animalId: string,
  formData: FormData
): Promise<MutationResult> {
  const { user, error } = await guardMutation();
  if (error || !user?.orgId) {
    return {
      ok: false,
      error: "Elevated re-authentication required.",
      code: "ELEVATED_REAUTH_REQUIRED",
    };
  }

  const input = parseInput(formData);
  if (!input.name || !input.species) {
    return { ok: false, error: "Name and species are required." };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("animals")
    .select("published_at, status, deleted_at")
    .eq("id", animalId)
    .eq("org_id", user.orgId)
    .maybeSingle();

  if (!existing) {
    return { ok: false, error: "Animal not found." };
  }

  // WP-13: daily CUD budget
  const cud = await consumeAnimalCud(user.orgId);
  if (!cud.ok) {
    return { ok: false, error: cud.error, code: cud.code };
  }

  const wasActive =
    isActiveAnimalStatus(existing.status) && !existing.deleted_at;
  const willBeActive =
    isActiveAnimalStatus(input.status) && input.status !== "removed";

  if (!wasActive && willBeActive) {
    const slot = await reserveActiveAnimal(user.orgId);
    if (!slot.ok) {
      return { ok: false, error: slot.error, code: slot.code };
    }
  }

  const published_at =
    input.status === "published"
      ? existing.published_at ?? new Date().toISOString()
      : existing.published_at;

  const deleted_at = input.status === "removed" ? new Date().toISOString() : null;

  const { error: updateError } = await supabase
    .from("animals")
    .update({
      name: input.name,
      species: input.species,
      breed: input.breed ?? null,
      age_group: input.age_group ?? null,
      sex: input.sex ?? null,
      size: input.size ?? null,
      summary: input.summary ?? null,
      description: input.description ?? null,
      special_needs: input.special_needs ?? null,
      country_code: input.country_code ?? null,
      subdivision: input.subdivision ?? null,
      city: input.city ?? null,
      cover_image_url: input.cover_image_url ?? null,
      status: input.status,
      published_at,
      deleted_at,
    })
    .eq("id", animalId)
    .eq("org_id", user.orgId);

  if (updateError) {
    if (!wasActive && willBeActive) {
      await releaseActiveAnimal(user.orgId);
    }
    logger.error("workspace.animal_update_failed", { animalId }, updateError);
    return { ok: false, error: updateError.message };
  }

  if (wasActive && !willBeActive) {
    await releaseActiveAnimal(user.orgId);
  }

  logger.info("workspace.animal_updated", { animalId, orgId: user.orgId });
  revalidatePath("/workspace");
  revalidatePath(`/workspace/animals/${animalId}/edit`);
  revalidatePath(`/animals/${animalId}`);
  revalidatePath("/");
  return { ok: true, id: animalId };
}

export async function softDeleteAnimal(animalId: string): Promise<MutationResult> {
  const { user, error } = await guardMutation();
  if (error || !user?.orgId) {
    return {
      ok: false,
      error: "Elevated re-authentication required.",
      code: "ELEVATED_REAUTH_REQUIRED",
    };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("animals")
    .select("status, deleted_at")
    .eq("id", animalId)
    .eq("org_id", user.orgId)
    .maybeSingle();

  if (!existing) {
    return { ok: false, error: "Animal not found." };
  }

  const cud = await consumeAnimalCud(user.orgId);
  if (!cud.ok) {
    return { ok: false, error: cud.error, code: cud.code };
  }

  const { error: updateError } = await supabase
    .from("animals")
    .update({
      status: "removed",
      deleted_at: new Date().toISOString(),
    })
    .eq("id", animalId)
    .eq("org_id", user.orgId);

  if (updateError) {
    logger.error("workspace.animal_soft_delete_failed", { animalId }, updateError);
    return { ok: false, error: updateError.message };
  }

  if (isActiveAnimalStatus(existing.status) && !existing.deleted_at) {
    await releaseActiveAnimal(user.orgId);
  }

  logger.info("workspace.animal_soft_deleted", { animalId, orgId: user.orgId });
  revalidatePath("/workspace");
  revalidatePath("/");
  return { ok: true, id: animalId };
}
