/**
 * Public site header — discovery + shop + auth-aware nav.
 */

import Link from "next/link";
import { getAuthUser } from "@/lib/auth/session";

export async function SiteHeader() {
  const user = await getAuthUser();

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-primary">
          Rescue Pawtrol
        </Link>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary">
            Animals
          </Link>
          <Link href="/shop" className="hover:text-primary">
            Shop
          </Link>
          {user?.role === "org_user" && (
            <Link href="/workspace" className="font-medium text-primary hover:underline">
              Workspace
            </Link>
          )}
          {(user?.role === "platform_admin" ||
            user?.role === "platform_moderator") && (
            <Link href="/admin" className="font-medium text-primary hover:underline">
              Admin
            </Link>
          )}
          {!user && (
            <Link href="/auth/login" className="hover:text-primary">
              Org sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
