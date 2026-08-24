/**
 * Header chrome — desktop 3-zone layout, mobile cart + hamburger.
 *
 * Left: brand (home)
 * Center: Shop · Contact · Workspace? · Admin?
 * Right: Cart · Sign in / Sign out
 */

"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/auth/actions";

export type HeaderUser = {
  role: string | null | undefined;
  email?: string | null;
} | null;

type Props = {
  user: HeaderUser;
  cartCount: number;
  brand: React.ReactNode;
};

const CENTER_LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/contact", label: "Contact" },
] as const;

function linkClass(active: boolean) {
  return active
    ? "font-semibold text-primary underline underline-offset-4"
    : "font-semibold text-primary hover:underline hover:underline-offset-4";
}

export function SiteHeaderNav({ user, cartCount, brand }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const isOrg = user?.role === "org_user";
  const isStaff =
    user?.role === "platform_admin" || user?.role === "platform_moderator";

  const roleLinks: { href: string; label: string }[] = [];
  if (isOrg) roleLinks.push({ href: "/workspace", label: "Workspace" });
  if (isStaff) roleLinks.push({ href: "/admin", label: "Admin" });

  const centerLinks = [
    ...CENTER_LINKS.map((l) => ({ href: l.href, label: l.label })),
    ...roleLinks,
  ];

  const signOutTo = isStaff ? "/auth/admin/login" : "/auth/login";
  const cartLabel = cartCount > 0 ? `Cart (${cartCount})` : "Cart";
  const cartActive =
    pathname === "/shop/cart" || pathname.startsWith("/shop/cart/");

  const drawer =
    open && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[200] md:hidden"
            id="mobile-nav"
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/50"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            />
            <div className="absolute right-0 top-0 flex h-full w-[min(20rem,88vw)] flex-col bg-white shadow-2xl">
              <div className="flex shrink-0 items-center justify-between border-b border-border bg-white px-4 py-3">
                <span className="text-sm font-semibold text-primary">Menu</span>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md text-primary hover:bg-muted"
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                >
                  <span aria-hidden className="text-lg leading-none">
                    &times;
                  </span>
                </button>
              </div>
              <nav className="flex flex-1 flex-col gap-1 overflow-y-auto bg-white p-3">
                {centerLinks.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="rounded-lg px-3 py-3 text-base font-semibold text-primary hover:bg-muted"
                    onClick={() => setOpen(false)}
                  >
                    {l.label}
                  </Link>
                ))}
                <Link
                  href="/shop/cart"
                  className="rounded-lg px-3 py-3 text-base font-semibold text-primary hover:bg-muted"
                  onClick={() => setOpen(false)}
                >
                  {cartLabel}
                </Link>
                {!user && (
                  <Link
                    href="/auth/login"
                    className="rounded-lg px-3 py-3 text-base font-semibold text-primary hover:bg-muted"
                    onClick={() => setOpen(false)}
                  >
                    Org sign in
                  </Link>
                )}
                {user && (
                  <div className="mt-2 border-t border-border px-3 pt-3">
                    {user.email && (
                      <p className="mb-2 truncate text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    )}
                    <form action={signOut.bind(null, signOutTo)}>
                      <button
                        type="submit"
                        className="text-sm font-semibold text-primary underline"
                      >
                        Sign out
                      </button>
                    </form>
                  </div>
                )}
              </nav>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div className="relative mx-auto flex h-14 max-w-7xl items-center px-3 sm:h-16 sm:px-6 lg:px-8">
        <div className="relative z-10 flex min-w-0 shrink-0 items-center">
          {brand}
        </div>

        <nav
          className="pointer-events-none absolute inset-x-0 hidden items-center justify-center gap-6 md:flex lg:gap-8"
          aria-label="Primary"
        >
          {centerLinks.map((l) => {
            const active =
              l.href === "/shop"
                ? pathname.startsWith("/shop") &&
                  !pathname.startsWith("/shop/cart")
                : pathname === l.href || pathname.startsWith(`${l.href}/`);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`pointer-events-auto ${linkClass(active)}`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="relative z-10 ml-auto flex items-center gap-3 sm:gap-4">
          <div className="hidden items-center gap-4 md:flex">
            <Link href="/shop/cart" className={linkClass(cartActive)}>
              {cartLabel}
            </Link>
            {!user && (
              <Link
                href="/auth/login"
                className={linkClass(pathname.startsWith("/auth"))}
              >
                Org sign in
              </Link>
            )}
            {user && (
              <form action={signOut.bind(null, signOutTo)}>
                <button type="submit" className={linkClass(false)}>
                  Sign out
                </button>
              </form>
            )}
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <Link
              href="/shop/cart"
              className="rounded-md px-2 py-1.5 text-sm font-semibold text-primary hover:bg-muted"
            >
              {cartLabel}
            </Link>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-primary hover:bg-muted"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? (
                <span aria-hidden className="text-lg leading-none">
                  &times;
                </span>
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
          </div>
        </div>
      </div>

      {drawer}
    </>
  );
}
