/**
 * Public header navigation — desktop links + mobile hamburger drawer.
 * Client component so the menu can open/close without a full page reload.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type HeaderUser = {
  role: string | null | undefined;
} | null;

type Props = {
  user: HeaderUser;
};

const PUBLIC_LINKS = [
  { href: "/", label: "Animals" },
  { href: "/shop", label: "Shop" },
  { href: "/contact", label: "Contact" },
] as const;

export function SiteHeaderNav({ user }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const roleLinks: { href: string; label: string }[] = [];
  if (user?.role === "org_user") {
    roleLinks.push({ href: "/workspace", label: "Workspace" });
  }
  if (user?.role === "platform_admin" || user?.role === "platform_moderator") {
    roleLinks.push({ href: "/admin", label: "Admin" });
  }
  if (!user) {
    roleLinks.push({ href: "/auth/login", label: "Org sign in" });
  }

  const allLinks = [...PUBLIC_LINKS, ...roleLinks];

  return (
    <>
      <nav className="hidden items-center gap-4 text-sm text-muted-foreground md:flex">
        {PUBLIC_LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="hover:text-primary">
            {l.label}
          </Link>
        ))}
        {roleLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={
              l.href === "/workspace" || l.href === "/admin"
                ? "font-medium text-primary hover:underline"
                : "hover:text-primary"
            }
          >
            {l.label}
          </Link>
        ))}
      </nav>

      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-md text-primary hover:bg-muted md:hidden"
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 7h16M4 12h16M4 17h16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden" id="mobile-nav">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-[min(20rem,85vw)] flex-col bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-semibold text-primary">Menu</span>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-primary hover:bg-muted"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <nav className="flex flex-col gap-1 p-3">
              {allLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-lg px-3 py-3 text-base font-medium text-primary hover:bg-muted"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
