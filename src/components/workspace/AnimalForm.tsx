/**
 * Shared create/edit form for org animals — WP-06.
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { WorkspaceAnimal } from "@/lib/data/workspace";
import { createAnimal, updateAnimal, type MutationResult } from "@/lib/workspace/actions";

const STATUSES = ["draft", "published", "pending", "adopted", "removed"] as const;
const SPECIES = ["dog", "cat", "other"];
const AGE_GROUPS = ["puppy/kitten", "young", "adult", "senior"];
const SEXES = ["male", "female", "unknown"];
const SIZES = ["small", "medium", "large", "xlarge"];

export function AnimalForm({
  animal,
  elevated,
}: {
  animal?: WorkspaceAnimal;
  elevated: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isEdit = Boolean(animal);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!elevated) {
      setError("Elevated verification required before saving.");
      return;
    }
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      let result: MutationResult;
      if (isEdit && animal) {
        result = await updateAnimal(animal.id, formData);
        if (result.ok) {
          router.refresh();
          return;
        }
      } else {
        result = await createAnimal(formData);
        // createAnimal redirects on success
      }
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-5">
      <Field label="Name" name="name" required defaultValue={animal?.name} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Species" name="species" options={SPECIES} defaultValue={animal?.species ?? "dog"} />
        <Select label="Status" name="status" options={[...STATUSES]} defaultValue={animal?.status ?? "draft"} />
        <Field label="Breed" name="breed" defaultValue={animal?.breed ?? ""} />
        <Select label="Age group" name="age_group" options={AGE_GROUPS} defaultValue={animal?.age_group ?? ""} allowEmpty />
        <Select label="Sex" name="sex" options={SEXES} defaultValue={animal?.sex ?? ""} allowEmpty />
        <Select label="Size" name="size" options={SIZES} defaultValue={animal?.size ?? ""} allowEmpty />
        <Field label="Country (ISO)" name="country_code" defaultValue={animal?.country_code ?? ""} placeholder="ES" />
        <Field label="City" name="city" defaultValue={animal?.city ?? ""} />
      </div>
      <Field label="Subdivision / region" name="subdivision" defaultValue={animal?.subdivision ?? ""} />
      <Field label="Cover image URL" name="cover_image_url" defaultValue={animal?.cover_image_url ?? ""} placeholder="https://…" />
      <TextArea label="Summary (card)" name="summary" defaultValue={animal?.summary ?? ""} rows={2} />
      <TextArea label="Full description" name="description" defaultValue={animal?.description ?? ""} rows={5} />
      <TextArea label="Special needs" name="special_needs" defaultValue={animal?.special_needs ?? ""} rows={2} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending || !elevated}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {pending ? "Saving…" : isEdit ? "Save changes" : "Create animal"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/workspace")}
          className="rounded-md border border-border px-4 py-2 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        name={name}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent-2"
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  rows,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  rows: number;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={rows}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent-2"
      />
    </label>
  );
}

function Select({
  label,
  name,
  options,
  defaultValue,
  allowEmpty,
}: {
  label: string;
  name: string;
  options: string[];
  defaultValue?: string;
  allowEmpty?: boolean;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue ?? ""}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent-2"
      >
        {allowEmpty && <option value="">—</option>}
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
