/**
 * Public site header — WP-05.
 * Lightweight navigation; shop link reserved for later WP-08.
 */

import Link from "next/link";

export function SiteHeader() {
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
          <Link href="/auth/login" className="hover:text-primary">
            Org sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}
