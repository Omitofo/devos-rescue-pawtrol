/**
 * Organisation profile / Contact / CTA settings — J-05.
 */

import Link from "next/link";
import { requireOrgMember } from "@/lib/auth/session";
import { hasElevatedWindow } from "@/lib/auth/elevated";
import { getOwnOrgProfile } from "@/lib/workspace/profile";
import { ElevatedReauthPanel } from "@/components/workspace/ElevatedReauthPanel";
import { ProfileForm } from "@/components/workspace/ProfileForm";

export default async function WorkspaceProfilePage() {
  const user = await requireOrgMember();
  const profile = await getOwnOrgProfile(user.orgId!);
  const elevated = await hasElevatedWindow();

  if (!profile) {
    return (
      <p className="text-sm text-muted-foreground">
        Organisation profile not found. Contact the platform team.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Public profile</h1>
          <p className="text-sm text-muted-foreground">
            Contact section and CTA text appear on your public page and animal
            listings.
          </p>
        </div>
        <Link
          href={`/organizations/${profile.slug}`}
          className="text-sm text-accent-2 underline"
        >
          View public page
        </Link>
      </div>

      {!elevated && user.email && <ElevatedReauthPanel email={user.email} />}

      <ProfileForm profile={profile} elevated={elevated} />
    </div>
  );
}
