/**
 * Org workspace home — list animals (WP-06 / J-04) + quota feedback (WP-13).
 */

import Link from "next/link";
import { requireOrgMember } from "@/lib/auth/session";
import { hasElevatedWindow, elevatedRemainingSeconds } from "@/lib/auth/elevated";
import { listOrgAnimals } from "@/lib/data/workspace";
import { getQuotaSnapshot } from "@/lib/quota/service";
import { ElevatedReauthPanel } from "@/components/workspace/ElevatedReauthPanel";

function formatMb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function WorkspacePage() {
  const user = await requireOrgMember();
  const animals = await listOrgAnimals(user.orgId!);
  const elevated = await hasElevatedWindow();
  const remaining = await elevatedRemainingSeconds();
  const quota = await getQuotaSnapshot(user.orgId!);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Your animals</h1>
          <p className="text-sm text-muted-foreground">
            Manage listings for your organisation. Mutations need a short
            elevated verification window.
          </p>
        </div>
        <Link
          href="/workspace/animals/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          New animal
        </Link>
      </div>

      {!elevated && user.email && (
        <ElevatedReauthPanel email={user.email} />
      )}

      {elevated && (
        <p className="text-xs text-muted-foreground">
          Elevated window active (~{Math.ceil(remaining / 60)} minutes left).
        </p>
      )}

      {quota && (
        <div className="grid gap-3 rounded-xl border border-border bg-surface-elevated p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <QuotaStat
            label="Active animals"
            value={`${quota.active_animals_count} / ${quota.max_active_animals}`}
            warn={quota.active_animals_count >= quota.max_active_animals}
          />
          <QuotaStat
            label="Edits today"
            value={`${quota.animal_cud_today} / ${quota.max_animal_cud_per_day}`}
            warn={quota.animal_cud_today >= quota.max_animal_cud_per_day}
          />
          <QuotaStat
            label="Uploads today"
            value={`${quota.image_uploads_today} / ${quota.max_image_uploads_per_day}`}
            warn={quota.image_uploads_today >= quota.max_image_uploads_per_day}
          />
          <QuotaStat
            label="Storage"
            value={`${formatMb(quota.storage_bytes_used)} / ${formatMb(quota.max_storage_bytes)}`}
            warn={quota.storage_bytes_used >= quota.max_storage_bytes * 0.9}
          />
        </div>
      )}

      {animals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
          No animals yet. Create your first listing when editing is unlocked.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Species</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {animals.map((a) => (
                <tr key={a.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-primary">{a.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.species}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/workspace/animals/${a.id}/edit`}
                      className="text-sm font-medium text-accent-2 underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function QuotaStat({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={
          warn
            ? "font-medium text-amber-700 dark:text-amber-400"
            : "font-medium text-primary"
        }
      >
        {value}
      </p>
    </div>
  );
}
