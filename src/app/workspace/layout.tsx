/**
 * Organization workspace shell — WP-06 + profile.
 * Desktop: inline nav. Mobile: hamburger (ShellMobileNav).
 */

import Link from "next/link";
import { requireOrgMember } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/actions";
import { elevatedRemainingSeconds } from "@/lib/auth/elevated";
import { ShellMobileNav } from "@/components/ShellMobileNav";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireOrgMember();
  const remaining = await elevatedRemainingSeconds();

  const links = [
    { href: "/workspace", label: "Animals" },
    { href: "/workspace/profile", label: "Profile" },
    { href: "/", label: "Public site" },
  ];

  const status =
    remaining > 0 ? (
      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
        Editing unlocked {"\u00b7"} {Math.ceil(remaining / 60)}m
      </span>
    ) : (
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
        View only
      </span>
    );

  const signOutForm = (
    <form action={signOut.bind(null, "/auth/login")}>
      <button
        type="submit"
        className="text-sm text-muted-foreground underline hover:text-primary"
      >
        Sign out
      </button>
    </form>
  );

  return (
    <div className="min-h-screen bg-transparent">
      <header className="border-b border-border/80 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/workspace" className="shrink-0 font-semibold text-primary">
            Workspace
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground lg:inline">
              {user.email}
            </span>
            <ShellMobileNav links={links} status={status} footer={signOutForm} />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
