/**
 * Organization workspace shell — auth gate only; chrome in root SiteHeader.
 */

import { requireOrgMember } from "@/lib/auth/session";
import { elevatedRemainingSeconds } from "@/lib/auth/elevated";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireOrgMember();
  const remaining = await elevatedRemainingSeconds();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {remaining > 0 ? (
        <p className="mb-4 text-xs text-green-800">
          Editing unlocked · {Math.ceil(remaining / 60)}m remaining
        </p>
      ) : (
        <p className="mb-4 text-xs text-amber-900">
          View only — unlock editing from the workspace when needed.
        </p>
      )}
      {children}
    </div>
  );
}
