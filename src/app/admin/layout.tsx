/**
 * Admin Console shell — WP-07.
 * Requires platform_admin or platform_moderator.
 */

import Link from "next/link";
import { requirePlatformStaff } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/actions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePlatformStaff();

  return (
    <div className="min-h-screen bg-transparent">
      <header className="border-b border-border/80 bg-surface/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="font-semibold text-primary">
              Admin Console
            </Link>
            <nav className="flex items-center gap-3 text-sm text-muted-foreground">
              <Link href="/admin/orders" className="hover:text-primary">
                Orders
              </Link>
              <Link href="/admin/organizations/new" className="hover:text-primary">
                Provision
              </Link>
              <Link href="/" className="hover:text-primary">
                Public site
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="hidden sm:inline">
              {user.email} {"\u00b7"} {user.role}
            </span>
            <form action={signOut.bind(null, "/auth/admin/login")}>
              <button type="submit" className="underline">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
