/**
 * Upload / manage animal images — WP-04.
 * Requires elevated window (parent page already surfaces the panel).
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import {
  prepareAnimalUpload,
  registerAnimalMedia,
  deleteAnimalMedia,
  type MediaRow,
} from "@/lib/media/service";
import { MAX_IMAGE_BYTES, MAX_IMAGES_PER_ANIMAL } from "@/lib/media/constants";

function browserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export function MediaManager({
  animalId,
  initialMedia,
  elevated,
}: {
  animalId: string;
  initialMedia: MediaRow[];
  elevated: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!elevated) {
      setError("Unlock editing with the one-time code before uploading.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const prep = await prepareAnimalUpload(animalId, file.type, file.size);
      if (!prep.ok) {
        setError(prep.error);
        return;
      }

      const supabase = browserClient();
      const { error: uploadError } = await supabase.storage
        .from(prep.tokenBucket)
        .upload(prep.storagePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      const reg = await registerAnimalMedia({
        animalId,
        storagePath: prep.storagePath,
        contentType: file.type,
        sizeBytes: file.size,
        setAsCover: true,
      });

      if (!reg.ok) {
        setError(reg.error);
        return;
      }

      router.refresh();
    });
  }

  function onDelete(id: string) {
    if (!elevated) {
      setError("Unlock editing before deleting images.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await deleteAnimalMedia(id);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <section className="space-y-3 rounded-xl border border-border bg-surface-elevated p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold text-primary">Photos</h2>
          <p className="text-xs text-muted-foreground">
            Up to {MAX_IMAGES_PER_ANIMAL} images · max {MAX_IMAGE_BYTES / 1024 / 1024}{" "}
            MB each · JPEG/PNG/WebP/GIF
          </p>
        </div>
        <label
          className={`cursor-pointer rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground ${
            !elevated || pending || initialMedia.length >= MAX_IMAGES_PER_ANIMAL
              ? "pointer-events-none opacity-50"
              : ""
          }`}
        >
          {pending ? "Uploading…" : "Add photo"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            disabled={!elevated || pending}
            onChange={onFileChange}
          />
        </label>
      </div>

      {initialMedia.length === 0 ? (
        <p className="text-sm text-muted-foreground">No photos yet.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {initialMedia.map((m) => (
            <li key={m.id} className="relative overflow-hidden rounded-lg border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.public_url}
                alt={m.alt_text ?? ""}
                className="aspect-square w-full object-cover"
              />
              <button
                type="button"
                onClick={() => onDelete(m.id)}
                disabled={!elevated || pending}
                className="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white disabled:opacity-40"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  );
}
