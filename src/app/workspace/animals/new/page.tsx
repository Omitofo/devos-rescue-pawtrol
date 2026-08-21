/**
 * Create animal — WP-06.
 */

import Link from "next/link";
import { requireOrgMember } from "@/lib/auth/session";
import { hasElevatedWindow } from "@/lib/auth/elevated";
import { AnimalForm } from "@/components/workspace/AnimalForm";
import { ElevatedReauthPanel } from "@/components/workspace/ElevatedReauthPanel";

export default async function NewAnimalPage() {
  const user = await requireOrgMember();
  const elevated = await hasElevatedWindow();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/workspace" className="text-sm text-muted-foreground hover:text-primary">
          ← Back
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-primary">New animal</h1>
      </div>

      {!elevated && user.email && <ElevatedReauthPanel email={user.email} />}

      <AnimalForm elevated={elevated} />
    </div>
  );
}
