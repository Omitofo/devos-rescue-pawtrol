/**
 * Provision organisation (+ optional org_user) — WP-07 expand / J-07.
 */

import Link from "next/link";
import { provisionOrganization } from "@/lib/admin/provision";

export default function NewOrganizationPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-muted-foreground hover:text-primary">
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-primary">
          Provision organisation
        </h1>
        <p className="text-sm text-muted-foreground">
          Admin-only. No self-registration. Offline verification is assumed
          complete before you activate an organisation.
        </p>
      </div>

      <form action={provisionOrganization} className="space-y-5">
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-primary">
            Organisation
          </legend>
          <Field name="name" label="Name" required />
          <Field
            name="slug"
            label="Slug (URL)"
            placeholder="hope-paws-valencia"
          />
          <label className="block space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              Initial status
            </span>
            <select
              name="status"
              defaultValue="active"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
            >
              <option value="pending_verification">pending_verification</option>
              <option value="active">active</option>
              <option value="suspended">suspended</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Field name="country_code" label="Country (ISO)" placeholder="ES" maxLength={2} />
            <Field name="city" label="City" />
          </div>
          <Field name="public_email" label="Public email" type="email" />
          <Field name="public_phone" label="Public phone" />
          <Field name="cta_text" label="CTA text (animal pages)" />
          <label className="block space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              Description
            </span>
            <textarea
              name="description"
              rows={3}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
            />
          </label>
        </fieldset>

        <fieldset className="space-y-3 rounded-xl border border-border p-4">
          <legend className="px-1 text-sm font-semibold text-primary">
            Organisation user (optional)
          </legend>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="create_user" defaultChecked />
            Create login for this organisation
          </label>
          <Field name="user_email" label="User email" type="email" />
          <Field
            name="user_password"
            label="Temporary password (min 8)"
            type="password"
          />
          <Field name="user_display_name" label="Display name" />
          <p className="text-xs text-muted-foreground">
            Sets Auth app_metadata role=org_user and org_id, plus a profiles row.
            Share the password out-of-band; they can sign in at /auth/login.
          </p>
        </fieldset>

        <button
          type="submit"
          className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
        >
          Create organisation
        </button>
      </form>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  placeholder,
  maxLength,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent-2"
      />
    </label>
  );
}
