/**
 * Admin org detail — status + full quotas (WP-07 + WP-13).
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrganizationAdmin, getOrgQuota } from "@/lib/data/admin";
import { OrgStatusForm } from "@/components/admin/OrgStatusForm";
import { QuotaForm } from "@/components/admin/QuotaForm";

type Params = Promise<{ id: string }>;

export default async function AdminOrgPage({ params }: { params: Params }) {
  const { id } = await params;
  const org = await getOrganizationAdmin(id);
  if (!org) notFound();

  const quota = await getOrgQuota(id);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin" className="text-sm text-muted-foreground hover:text-primary">
          \u2190 Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-primary">{org.name}</h1>
        <p className="text-sm text-muted-foreground">
          /{org.slug} \u00b7 {[org.city, org.country_code].filter(Boolean).join(", ")}
        </p>
      </div>

      {org.description && (
        <p className="max-w-2xl text-sm text-primary/85">{org.description}</p>
      )}

      <section className="space-y-3 rounded-xl border border-border bg-surface-elevated p-5">
        <h2 className="font-semibold text-primary">Status</h2>
        <OrgStatusForm orgId={org.id} current={org.status} />
      </section>

      {quota && (
        <section className="space-y-4 rounded-xl border border-border bg-surface-elevated p-5">
          <h2 className="font-semibold text-primary">Quotas</h2>
          <ul className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
            <li>
              Active animals:{" "}
              <span className="font-medium text-primary">
                {quota.active_animals_count} / {quota.max_active_animals}
              </span>
            </li>
            <li>
              Edits today:{" "}
              <span className="font-medium text-primary">
                {quota.animal_cud_today ?? 0} / {quota.max_animal_cud_per_day ?? "\u2014"}
              </span>
            </li>
            <li>
              Uploads today:{" "}
              <span className="font-medium text-primary">
                {quota.image_uploads_today ?? 0} /{" "}
                {quota.max_image_uploads_per_day ?? "\u2014"}
              </span>
            </li>
            <li>
              Storage:{" "}
              <span className="font-medium text-primary">
                {(quota.storage_bytes_used / 1024 / 1024).toFixed(1)} /{" "}
                {(quota.max_storage_bytes / 1024 / 1024).toFixed(1)} MB
              </span>
            </li>
            <li>
              Max images / animal:{" "}
              <span className="font-medium text-primary">
                {quota.max_images_per_animal ?? 8}
              </span>
            </li>
          </ul>
          <QuotaForm
            orgId={org.id}
            values={{
              max_active_animals: quota.max_active_animals,
              max_animal_cud_per_day: quota.max_animal_cud_per_day ?? 20,
              max_image_uploads_per_day: quota.max_image_uploads_per_day ?? 40,
              max_images_per_animal: quota.max_images_per_animal ?? 8,
              max_storage_mb: Math.round(quota.max_storage_bytes / 1024 / 1024),
            }}
          />
        </section>
      )}

      <section className="space-y-2 rounded-xl border border-border p-5">
        <h2 className="font-semibold text-primary">Public contact</h2>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>Email: {org.public_email ?? "\u2014"}</li>
          <li>Phone: {org.public_phone ?? "\u2014"}</li>
          <li>Website: {org.website_url ?? "\u2014"}</li>
        </ul>
        {org.cta_text && (
          <p className="mt-2 text-primary/85">CTA: {org.cta_text}</p>
        )}
      </section>

      <Link
        href={`/organizations/${org.slug}`}
        className="inline-block text-sm text-accent-2 underline"
      >
        View public profile
      </Link>
    </div>
  );
}
