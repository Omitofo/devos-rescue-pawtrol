/**
 * Public contact / "Join as rescue" lead form — WP-12 (FR-16).
 *
 * Zero account gate. Submissions land in `leads` (admin-only visibility).
 * No platform message thread — orgs remain responsible for adoption flow.
 */

import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { submitLead } from "@/lib/leads/actions";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Rescue Pawtrol or apply to list your rescue organisation on the platform.",
};

type SearchParams = Promise<{ sent?: string; error?: string }>;

const ERROR_COPY: Record<string, string> = {
  email: "Please enter a valid email address.",
  message: "Please write a short message (at least 10 characters).",
  country: "Country must be a 2-letter ISO code (e.g. ES, PH, VE).",
  server: "Something went wrong saving your message. Please try again.",
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const q = await searchParams;
  const sent = q.sent === "1";
  const errorKey = q.error;
  const errorMsg = errorKey ? ERROR_COPY[errorKey] ?? "Please check the form and try again." : null;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-lg px-4 py-10 sm:px-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-primary">Contact us</h1>
          <p className="text-sm text-muted-foreground">
            Questions about the platform, or a rescue organisation that wants to
            list animals? Send a note — we review every message. No account is
            required.
          </p>
        </div>

        {sent ? (
          <div className="mt-8 space-y-4 rounded-xl border border-border bg-surface-elevated p-6">
            <h2 className="text-lg font-medium text-primary">Message received</h2>
            <p className="text-sm text-muted-foreground">
              Thanks. A platform admin will review your lead. If you are a rescue
              applying to join, we may follow up with a short offline verification
              (phone / video / documents).
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link href="/" className="text-accent-2 underline">
                Browse animals
              </Link>
              <Link href="/contact" className="text-muted-foreground underline">
                Send another message
              </Link>
            </div>
          </div>
        ) : (
          <form action={submitLead} className="mt-8 space-y-4">
            {errorMsg && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                {errorMsg}
              </p>
            )}

            <fieldset className="space-y-2">
              <legend className="text-xs font-medium text-muted-foreground">
                I am writing to…
              </legend>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="intent"
                    value="contact"
                    defaultChecked
                    className="accent-primary"
                  />
                  General contact
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="intent"
                    value="join"
                    className="accent-primary"
                  />
                  Join as a rescue organisation
                </label>
              </div>
            </fieldset>

            <Field name="email" label="Email" type="email" required />
            <Field name="name" label="Your name" />
            <Field name="phone" label="Phone (optional)" type="tel" />
            <Field
              name="organization_name"
              label="Organisation name (if joining)"
              placeholder="Hope Paws Valencia"
            />
            <Field
              name="country_code"
              label="Country (ISO, e.g. ES)"
              placeholder="ES"
              maxLength={2}
            />
            <label className="block space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                Message
              </span>
              <textarea
                name="message"
                required
                rows={5}
                minLength={10}
                placeholder="How can we help, or tell us about your rescue…"
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent-2"
              />
            </label>

            <button
              type="submit"
              className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
            >
              Send message
            </button>

            <p className="text-xs text-muted-foreground">
              We store your details only to respond. Platform staff can see
              submissions; the public cannot.
            </p>
          </form>
        )}
      </main>
    </>
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
