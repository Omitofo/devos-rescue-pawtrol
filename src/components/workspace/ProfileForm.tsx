/**
 * Org profile / Contact / CTA form — J-05.
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OrgProfile } from "@/lib/workspace/profile";
import { updateOrgProfile } from "@/lib/workspace/profile-actions";

export function ProfileForm({
  profile,
  elevated,
}: {
  profile: OrgProfile;
  elevated: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!elevated) {
      setError("Unlock editing with the one-time code (or sign in again) first.");
      return;
    }
    setError(null);
    setSaved(false);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateOrgProfile(formData);
      if (result.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-5">
      <Field label="Organisation name" name="name" required defaultValue={profile.name} />
      <p className="text-xs text-muted-foreground">
        Public URL slug: <code className="text-primary">/{profile.slug}</code>{" "}
        (slug changes are admin-only for now)
      </p>

      <label className="block space-y-1">
        <span className="text-xs font-medium text-muted-foreground">Description</span>
        <textarea
          name="description"
          rows={4}
          defaultValue={profile.description ?? ""}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent-2"
        />
      </label>

      <fieldset className="space-y-3 rounded-xl border border-border p-4">
        <legend className="px-1 text-sm font-semibold text-primary">
          Contact / How to reach us
        </legend>
        <p className="text-xs text-muted-foreground">
          Shown on your public organisation page. The animal-page CTA sends
          adopters here.
        </p>
        <Field
          label="CTA text (button on animal pages)"
          name="cta_text"
          defaultValue={profile.cta_text ?? ""}
          placeholder="Want to meet this friend? Message us on WhatsApp…"
        />
        <Field
          label="Public email"
          name="public_email"
          type="email"
          defaultValue={profile.public_email ?? ""}
        />
        <Field
          label="Public phone"
          name="public_phone"
          defaultValue={profile.public_phone ?? ""}
        />
        <Field
          label="Website URL"
          name="website_url"
          defaultValue={profile.website_url ?? ""}
        />
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label="Country (ISO)"
          name="country_code"
          defaultValue={profile.country_code ?? ""}
          placeholder="ES"
        />
        <Field
          label="Region"
          name="subdivision"
          defaultValue={profile.subdivision ?? ""}
        />
        <Field label="City" name="city" defaultValue={profile.city ?? ""} />
      </div>

      <Field
        label="Logo image URL"
        name="logo_url"
        defaultValue={profile.logo_url ?? ""}
        placeholder="https://…"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && (
        <p className="text-sm text-green-700">Saved. Public pages will show the update.</p>
      )}

      <button
        type="submit"
        disabled={pending || !elevated}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  placeholder,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent-2"
      />
    </label>
  );
}
