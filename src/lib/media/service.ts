"use server";

/**
 * Media service — WP-04.
 *
 * Flow:
 * 1. Client requests upload slot (checks elevated window + quotas).
 * 2. Client uploads bytes to Storage with the returned path (authenticated).
 * 3. Client registers metadata row via registerAnimalMedia.
 *
 * Public URLs use the public bucket URL for MVP simplicity.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireOrgMember } from "@/lib/auth/session";
import { requireElevatedWindow } from "@/lib/auth/elevated";
import { logger } from "@/lib/logger";
import {
  MEDIA_BUCKET,
  MAX_IMAGES_PER_ANIMAL,
  MAX_IMAGE_BYTES,
  ALLOWED_MIME,
} from "./constants";

export type MediaRow = {
  id: string;
  animal_id: string;
  org_id: string;
  storage_path: string;
  content_type: string;
  size_bytes: number;
  sort_order: number;
  alt_text: string | null;
  public_url: string;
};

function publicUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${MEDIA_BUCKET}/${storagePath}`;
}

export async function listAnimalMedia(animalId: string): Promise<MediaRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("animal_media")
    .select(
      "id, animal_id, org_id, storage_path, content_type, size_bytes, sort_order, alt_text"
    )
    .eq("animal_id", animalId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];

  return data.map((row) => ({
    ...row,
    public_url: publicUrl(row.storage_path),
  }));
}

/**
 * Prepare an upload: validates quotas and returns the storage path to use.
 */
export async function prepareAnimalUpload(
  animalId: string,
  contentType: string,
  sizeBytes: number
): Promise<
  | { ok: true; storagePath: string; tokenBucket: string }
  | { ok: false; error: string }
> {
  const user = await requireOrgMember();
  try {
    await requireElevatedWindow();
  } catch {
    return { ok: false, error: "Elevated re-authentication required." };
  }

  if (!ALLOWED_MIME.includes(contentType as (typeof ALLOWED_MIME)[number])) {
    return { ok: false, error: "Only JPEG, PNG, WebP, or GIF images are allowed." };
  }
  if (sizeBytes <= 0 || sizeBytes > MAX_IMAGE_BYTES) {
    return { ok: false, error: `Image must be under ${MAX_IMAGE_BYTES / 1024 / 1024} MB.` };
  }

  const supabase = await createClient();

  // Own the animal
  const { data: animal } = await supabase
    .from("animals")
    .select("id, org_id")
    .eq("id", animalId)
    .eq("org_id", user.orgId!)
    .is("deleted_at", null)
    .maybeSingle();

  if (!animal) {
    return { ok: false, error: "Animal not found." };
  }

  const { count } = await supabase
    .from("animal_media")
    .select("id", { count: "exact", head: true })
    .eq("animal_id", animalId)
    .is("deleted_at", null);

  if ((count ?? 0) >= MAX_IMAGES_PER_ANIMAL) {
    return {
      ok: false,
      error: `Maximum of ${MAX_IMAGES_PER_ANIMAL} images per animal.`,
    };
  }

  const ext =
    contentType === "image/png"
      ? "png"
      : contentType === "image/webp"
        ? "webp"
        : contentType === "image/gif"
          ? "gif"
          : "jpg";

  const storagePath = `${user.orgId}/${animalId}/${crypto.randomUUID()}.${ext}`;

  return { ok: true, storagePath, tokenBucket: MEDIA_BUCKET };
}

/**
 * After a successful Storage upload, register metadata and optionally set cover.
 */
export async function registerAnimalMedia(input: {
  animalId: string;
  storagePath: string;
  contentType: string;
  sizeBytes: number;
  altText?: string;
  setAsCover?: boolean;
}): Promise<{ ok: true; id: string; publicUrl: string } | { ok: false; error: string }> {
  const user = await requireOrgMember();
  try {
    await requireElevatedWindow();
  } catch {
    return { ok: false, error: "Elevated re-authentication required." };
  }

  // Path must start with this org
  if (!input.storagePath.startsWith(`${user.orgId}/`)) {
    return { ok: false, error: "Invalid storage path." };
  }

  const supabase = await createClient();

  const { data: animal } = await supabase
    .from("animals")
    .select("id")
    .eq("id", input.animalId)
    .eq("org_id", user.orgId!)
    .maybeSingle();

  if (!animal) {
    return { ok: false, error: "Animal not found." };
  }

  const { count } = await supabase
    .from("animal_media")
    .select("id", { count: "exact", head: true })
    .eq("animal_id", input.animalId)
    .is("deleted_at", null);

  const sortOrder = count ?? 0;

  const { data, error } = await supabase
    .from("animal_media")
    .insert({
      animal_id: input.animalId,
      org_id: user.orgId!,
      storage_path: input.storagePath,
      content_type: input.contentType,
      size_bytes: input.sizeBytes,
      sort_order: sortOrder,
      alt_text: input.altText ?? null,
    })
    .select("id")
    .single();

  if (error) {
    logger.error("media.register_failed", { animalId: input.animalId }, error);
    return { ok: false, error: error.message };
  }

  const url = publicUrl(input.storagePath);

  if (input.setAsCover || sortOrder === 0) {
    await supabase
      .from("animals")
      .update({ cover_image_url: url })
      .eq("id", input.animalId)
      .eq("org_id", user.orgId!);
  }

  logger.info("media.registered", { id: data.id, animalId: input.animalId });
  revalidatePath(`/workspace/animals/${input.animalId}/edit`);
  revalidatePath(`/animals/${input.animalId}`);
  revalidatePath("/");

  return { ok: true, id: data.id, publicUrl: url };
}

export async function deleteAnimalMedia(
  mediaId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireOrgMember();
  try {
    await requireElevatedWindow();
  } catch {
    return { ok: false, error: "Elevated re-authentication required." };
  }

  const supabase = await createClient();

  const { data: row } = await supabase
    .from("animal_media")
    .select("id, animal_id, storage_path, org_id")
    .eq("id", mediaId)
    .eq("org_id", user.orgId!)
    .is("deleted_at", null)
    .maybeSingle();

  if (!row) {
    return { ok: false, error: "Media not found." };
  }

  // Soft-delete metadata
  await supabase
    .from("animal_media")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", mediaId);

  // Best-effort remove from Storage
  await supabase.storage.from(MEDIA_BUCKET).remove([row.storage_path]);

  // If cover pointed at this file, clear or point to next
  const { data: animal } = await supabase
    .from("animals")
    .select("cover_image_url")
    .eq("id", row.animal_id)
    .maybeSingle();

  const removedUrl = publicUrl(row.storage_path);
  if (animal?.cover_image_url === removedUrl) {
    const remaining = await listAnimalMedia(row.animal_id);
    const next = remaining.find((m) => m.id !== mediaId);
    await supabase
      .from("animals")
      .update({ cover_image_url: next?.public_url ?? null })
      .eq("id", row.animal_id);
  }

  revalidatePath(`/workspace/animals/${row.animal_id}/edit`);
  revalidatePath(`/animals/${row.animal_id}`);
  revalidatePath("/");

  return { ok: true };
}
