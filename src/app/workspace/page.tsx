/**
 * Org workspace home — list animals (WP-06 / J-04).
 */

import Link from "next/link";
import { requireOrgMember } from "@/lib/auth/session";
import { hasElevatedWindow, elevatedRemainingSeconds } from "@/lib/auth/elevated";
import { listOrgAnimals } from "@/lib/data/workspace";
import { ElevatedReauthPanel } from "@/components/workspace/ElevatedReauthPanel";

export default async function WorkspacePage() {
  const user = await requireOrgMember();
  const animals = await listOrgAnimals(user.orgId!);
  const elevated = await hasElevatedWindow();
  const remaining = await elevatedRemainingSeconds();

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
