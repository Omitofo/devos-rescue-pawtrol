/**
 * Organization workspace shell — WP-06 + profile.
 */

import Link from "next/link";
import { requireOrgMember } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/actions";
import { elevatedRemainingSeconds } from "@/lib/auth/elevated";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireOrgMember();
  const remaining = await elevatedRemainingSeconds();

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-surface-elevated">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/workspace" className="font-semibold text-primary">
              Org workspace
            </Link>
            <Link
              href="/workspace/profile"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Profile
            </Link>
            <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
              Public site
            </Link>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="hidden sm:inline">{user.email}</span>
            {remaining > 0 ? (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                Editing unlocked · {Math.ceil(remaining / 60)}m
              </span>
            ) : (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                View only
              </span>
            )}
            <form action={signOut.bind(null, "/auth/login")}>
              <button type="submit" className="text-sm underline">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
