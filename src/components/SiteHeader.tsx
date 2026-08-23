/**
 * Public site header — fixed so nav stays available at all viewport sizes.
 * Frosted glass: translucent white + blur so brand colors show through.
 */

import Link from "next/link";
import { getAuthUser } from "@/lib/auth/session";
import { SiteHeaderNav } from "@/components/SiteHeaderNav";

export async function SiteHeader() {
  const user = await getAuthUser();

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/40 bg-white/60 backdrop-blur-md supports-[backdrop-filter]:bg-white/50">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-3 sm:h-16 sm:px-6">
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
      <div className="h-14 shrink-0 sm:h-16" aria-hidden />
    </>
  );
}
