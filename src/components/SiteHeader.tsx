/**
 * Public site header — logo + discovery + shop + contact + auth-aware nav.
 * Desktop: inline links. Mobile: hamburger drawer (SiteHeaderNav).
 */

import Link from "next/link";
import { getAuthUser } from "@/lib/auth/session";
import { SiteHeaderNav } from "@/components/SiteHeaderNav";

export async function SiteHeader() {
  const user = await getAuthUser();

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-3 sm:px-6">
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

        <SiteHeaderNav user={user ? { role: user.role } : null} />
      </div>
    </header>
  );
}
