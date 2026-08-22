"use client";

/**
 * Admin quota editor — full limit set (WP-13).
 * Usage counters are read-only on the parent page; this form edits limits only.
 */

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrgQuota, type OrgQuotaLimits } from "@/lib/admin/actions";

export type QuotaFormValues = {
  max_active_animals: number;
  max_animal_cud_per_day: number;
  max_image_uploads_per_day: number;
  max_images_per_animal: number;
  /** Displayed/edited in MB; converted to bytes on submit */
  max_storage_mb: number;
};

export function QuotaForm({
  orgId,
  values,
}: {
  orgId: string;
  values: QuotaFormValues;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const limits: OrgQuotaLimits = {
          max_active_animals: Number(fd.get("max_active_animals")),
          max_animal_cud_per_day: Number(fd.get("max_animal_cud_per_day")),
          max_image_uploads_per_day: Number(fd.get("max_image_uploads_per_day")),
          max_images_per_animal: Number(fd.get("max_images_per_animal")),
          max_storage_bytes: Math.round(
            Number(fd.get("max_storage_mb")) * 1024 * 1024
          ),
        };
        startTransition(async () => {
          await updateOrgQuota(orgId, limits);
          router.refresh();
        });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          name="max_active_animals"
          label="Max active animals"
          defaultValue={values.max_active_animals}
          min={1}
        />
        <Field
          name="max_animal_cud_per_day"
          label="Max animal edits / day (CUD)"
          defaultValue={values.max_animal_cud_per_day}
          min={1}
        />
        <Field
          name="max_image_uploads_per_day"
          label="Max image uploads / day"
          defaultValue={values.max_image_uploads_per_day}
          min={1}
        />
        <Field
          name="max_images_per_animal"
          label="Max images per animal"
          defaultValue={values.max_images_per_animal}
          min={1}
          max={20}
        />
        <Field
          name="max_storage_mb"
          label="Max storage (MB)"
          defaultValue={values.max_storage_mb}
          min={50}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {pending ? "Saving\u2026" : "Update quotas"}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  defaultValue,
  min,
  max,
}: {
  name: string;
  label: string;
  defaultValue: number;
  min?: number;
  max?: number;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        type="number"
        name={name}
        min={min}
        max={max}
        defaultValue={defaultValue}
        required
        className="block w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
      />
    </label>
  );
}
