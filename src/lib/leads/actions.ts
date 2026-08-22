"use server";

/**
 * Public lead capture — WP-12 (FR-16).
 *
 * Anyone can submit (RLS: INSERT WITH CHECK true).
 * No platform account is created. Records are admin-only (SELECT/UPDATE/DELETE).
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export type LeadResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Form action for /contact.
 * Validates lightly, inserts into leads, redirects to thank-you state.
 */
export async function submitLead(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const organization_name = String(formData.get("organization_name") ?? "").trim();
  const country_code = String(formData.get("country_code") ?? "")
    .trim()
    .toUpperCase();
  const message = String(formData.get("message") ?? "").trim();
  const intent = String(formData.get("intent") ?? "contact").trim();

  if (!email.includes("@") || email.length < 5) {
    redirect("/contact?error=email");
  }

  if (message.length < 10) {
    redirect("/contact?error=message");
  }

  if (country_code && country_code.length !== 2) {
    redirect("/contact?error=country");
  }

  // Prefix message with intent so admins can triage Join vs general contact
  const body =
    intent === "join"
      ? `[Join as rescue]\n${message}`
      : message;

  const supabase = await createClient();

  const { error } = await supabase.from("leads").insert({
    email,
    name: name || null,
    phone: phone || null,
    organization_name: organization_name || null,
    country_code: country_code || null,
    message: body,
    status: "new",
  });

  if (error) {
    logger.error("lead.submit_failed", { email }, error);
    redirect("/contact?error=server");
  }

  logger.info("lead.submitted", {
    hasOrg: Boolean(organization_name),
    intent,
    country: country_code || null,
  });

  redirect("/contact?sent=1");
}
