"use client";

/**
 * Admin quota editor — WP-13 surface for organization_quotas limits.
 */

import { useTransition } from "react";
import { updateOrgQuotas } from "@/lib/admin/quota-actions";

export type QuotaFormValues = {
  max_active_animals: number;
  max_storage_bytes: number;
  max_animal_cud_per_day: number;
  max_image_uploads_per_day: number;
  max_images_per_animal: number;
};

export function QuotaForm({
  orgId,
  initial,
}: {
  orgId: string;
  initial: QuotaFormValues;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      action={(fd) => {
        startTransition(async () => {
          const result = await updateOrgQuotas(orgId, fd);
          if (result && !result.ok) alert(result.error);
        });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          name="max_active_animals"
          label="Max active animals"
          defaultValue={initial.max_active_animals}
        />
        <Field
          name="max_storage_mb"
          label="Max storage (MB)"
          defaultValue={Math.round(initial.max_storage_bytes / (1024 * 1024))}
        />
        <Field
          name="max_animal_cud_per_day"
          label="Animal CUD / day"
          defaultValue={initial.max_animal_cud_per_day}
        />
        <Field
          name="max_image_uploads_per_day"
          label="Image uploads / day"
          defaultValue={initial.max_image_uploads_per_day}
        />
        <Field
          name="max_images_per_animal"
          label="Images per animal"
          defaultValue={initial.max_images_per_animal}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {pending ? "Saving…" : "Update quotas"}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: number;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        name={name}
        type="number"
        min={0}
        defaultValue={defaultValue}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
      />
    </label>
  );
}
