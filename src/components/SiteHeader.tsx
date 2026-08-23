/**
 * Public site header — logo + discovery + shop + contact + auth-aware nav.
 */

import Link from "next/link";
import { getAuthUser } from "@/lib/auth/session";
import { LOGO_WEBP_DATA_URL } from "@/lib/brand/assets";

export async function SiteHeader() {
  const user = await getAuthUser();

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-primary"
        >
          {/* Official paw + heart logo — left of wordmark */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO_WEBP_DATA_URL}
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 shrink-0"
          />
          <span>Rescue Pawtrol</span>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-3 text-sm text-muted-foreground sm:gap-4">
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
              Org sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
