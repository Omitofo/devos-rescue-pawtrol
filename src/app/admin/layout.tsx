/**
 * Admin Console shell — WP-07.
 * Desktop: inline nav. Mobile: hamburger (ShellMobileNav).
 */

import Link from "next/link";
import { requirePlatformStaff } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/actions";
import { ShellMobileNav } from "@/components/ShellMobileNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePlatformStaff();

  const links = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/orders", label: "Orders" },
    { href: "/admin/organizations/new", label: "Provision" },
    { href: "/", label: "Public site" },
  ];

  const signOutForm = (
    <form action={signOut.bind(null, "/auth/admin/login")}>
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
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/admin" className="shrink-0 font-semibold text-primary">
            Admin Console
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground lg:inline">
              {user.email}
            </span>
            <ShellMobileNav links={links} footer={signOutForm} />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
