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

      <section className="space-y-3 rounded-xl border border-border bg-surface-elevated p-5">
        <h2 className="font-semibold text-primary">Quotas</h2>
        {quota ? (
          <>
            <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <li>
                Active animals: {quota.active_animals_count} /{" "}
                {quota.max_active_animals}
              </li>
              <li>
                Storage: {Math.round(quota.storage_bytes_used / (1024 * 1024))} MB /{" "}
                {Math.round(quota.max_storage_bytes / (1024 * 1024))} MB
              </li>
              <li>
                Animal CUD today: {quota.animal_cud_today ?? 0} /{" "}
                {quota.max_animal_cud_per_day ?? "—"}
              </li>
              <li>
                Image uploads today: {quota.image_uploads_today ?? 0} /{" "}
                {quota.max_image_uploads_per_day ?? "—"}
              </li>
              <li>
                Max images / animal: {quota.max_images_per_animal ?? "—"}
              </li>
            </ul>
            <QuotaForm
              orgId={org.id}
              values={{
                max_active_animals: quota.max_active_animals,
                max_animal_cud_per_day: quota.max_animal_cud_per_day ?? 50,
                max_image_uploads_per_day: quota.max_image_uploads_per_day ?? 30,
                max_images_per_animal: quota.max_images_per_animal ?? 8,
                max_storage_mb: Math.round(
                  quota.max_storage_bytes / (1024 * 1024)
                ),
              }}
            />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No quota row yet.</p>
        )}
      </section>

      <section className="space-y-2 text-sm">
        <h2 className="font-semibold text-primary">Public contact</h2>
        <ul className="space-y-1 text-muted-foreground">
          <li>Email: {org.public_email ?? "—"}</li>
          <li>Phone: {org.public_phone ?? "—"}</li>
          <li>Website: {org.website_url ?? "—"}</li>
          <li>CTA: {org.cta_text ?? "—"}</li>
        </ul>
      </section>
    </div>
  );
}
