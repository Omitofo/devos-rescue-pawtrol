/**
 * Public site header — logo + discovery + shop + contact + auth-aware nav.
 * Responsive: wraps cleanly on narrow viewports; shorter labels under sm.
 */

import Link from "next/link";
import { getAuthUser } from "@/lib/auth/session";

export async function SiteHeader() {
  const user = await getAuthUser();

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-3 py-3 sm:px-6">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 text-base font-semibold tracking-tight text-primary sm:gap-2.5 sm:text-lg"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo.png"
            alt=""
            width={40}
            height={40}
            className="h-8 w-8 shrink-0 object-contain sm:h-10 sm:w-10"
          />
          <span className="truncate">Rescue Pawtrol</span>
        </Link>
        <nav className="flex max-w-full flex-wrap items-center justify-end gap-x-3 gap-y-1 text-xs text-muted-foreground sm:gap-x-4 sm:text-sm">
          <Link href="/" className="hover:text-primary">
            Animals
          </Link>
          <Link href="/shop" className="hover:text-primary">
            Shop
          </Link>
          <Link href="/contact" className="hover:text-primary">
            Contact
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
              <span className="sm:hidden">Sign in</span>
              <span className="hidden sm:inline">Org sign in</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
