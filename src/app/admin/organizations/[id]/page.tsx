/**
 * Admin org detail — status + quotas (WP-07 + WP-13 usage visibility).
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
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-primary">{org.name}</h1>
        <p className="text-sm text-muted-foreground">
          /{org.slug} · {[org.city, org.country_code].filter(Boolean).join(", ")}
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
        <section className="space-y-3 rounded-xl border border-border bg-surface-elevated p-5">
          <h2 className="font-semibold text-primary">Quotas</h2>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>
              Active animals: {quota.active_animals_count} / {quota.max_active_animals}
            </li>
            <li>
              Edits today: {quota.animal_cud_today ?? 0} /{" "}
              {quota.max_animal_cud_per_day ?? "—"}
            </li>
            <li>
              Uploads today: {quota.image_uploads_today ?? 0} /{" "}
              {quota.max_image_uploads_per_day ?? "—"}
            </li>
            <li>
              Storage:{" "}
              {(quota.storage_bytes_used / 1024 / 1024).toFixed(1)} /{" "}
              {(quota.max_storage_bytes / 1024 / 1024).toFixed(1)} MB
            </li>
            <li>
              Max images per animal: {quota.max_images_per_animal ?? 8}
            </li>
          </ul>
          <QuotaForm orgId={org.id} maxActiveAnimals={quota.max_active_animals} />
        </section>
      )}

      <section className="space-y-2 text-sm">
        <h2 className="font-semibold text-primary">Public contact</h2>
        <ul className="space-y-1 text-muted-foreground">
          <li>Email: {org.public_email ?? "—"}</li>
          <li>Phone: {org.public_phone ?? "—"}</li>
          <li>Website: {org.website_url ?? "—"}</li>
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
