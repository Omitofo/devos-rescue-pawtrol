/**
 * Universal header nav — same links on every surface.
 *
 * Desktop: Shop · Contact · Cart · (Workspace|Admin) · Sign in/out
 * Mobile: Cart always visible; hamburger for the rest (portaled drawer)
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
};

const PRIMARY_LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/contact", label: "Contact" },
] as const;

function linkClass(active: boolean) {
  return active
    ? "font-medium text-primary"
    : "text-muted-foreground hover:text-primary";
}

export function SiteHeaderNav({ user, cartCount }: Props) {
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

  const accountLinks: { href: string; label: string }[] = [];
  if (isOrg) accountLinks.push({ href: "/workspace", label: "Workspace" });
  if (isStaff) accountLinks.push({ href: "/admin", label: "Admin" });

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
                {PRIMARY_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="rounded-lg px-3 py-3 text-base font-medium text-primary hover:bg-muted"
                    onClick={() => setOpen(false)}
                  >
                    {l.label}
                  </Link>
                ))}
                <Link
                  href="/shop/cart"
                  className="rounded-lg px-3 py-3 text-base font-medium text-primary hover:bg-muted"
                  onClick={() => setOpen(false)}
                >
                  {cartLabel}
                </Link>
                {accountLinks.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="rounded-lg px-3 py-3 text-base font-medium text-primary hover:bg-muted"
                    onClick={() => setOpen(false)}
                  >
                    {l.label}
                  </Link>
                ))}
                {!user && (
                  <Link
                    href="/auth/login"
                    className="rounded-lg px-3 py-3 text-base font-medium text-primary hover:bg-muted"
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
                        className="text-sm text-muted-foreground underline hover:text-primary"
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
      <div className="hidden items-center gap-4 text-sm md:flex">
        <nav className="flex items-center gap-4">
          {PRIMARY_LINKS.map((l) => {
            const active =
              l.href === "/shop"
                ? pathname.startsWith("/shop") &&
                  !pathname.startsWith("/shop/cart")
                : pathname === l.href || pathname.startsWith(`${l.href}/`);
            return (
              <Link key={l.href} href={l.href} className={linkClass(active)}>
                {l.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/shop/cart"
          className={`font-medium ${
            cartActive ? "text-primary" : "text-primary hover:underline"
          }`}
        >
          {cartLabel}
        </Link>

        {(accountLinks.length > 0 || !user) && (
          <span className="h-4 w-px bg-border" aria-hidden />
        )}

        <nav className="flex items-center gap-3">
          {accountLinks.map((l) => {
            const active =
              pathname === l.href || pathname.startsWith(`${l.href}/`);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`font-medium ${
                  active ? "text-primary" : "text-primary hover:underline"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          {!user && (
            <Link
              href="/auth/login"
              className="text-muted-foreground hover:text-primary"
            >
              Org sign in
            </Link>
          )}
          {user && (
            <form action={signOut.bind(null, signOutTo)}>
              <button
                type="submit"
                className="text-muted-foreground hover:text-primary"
              >
                Sign out
              </button>
            </form>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-1 md:hidden">
        <Link
          href="/shop/cart"
          className="rounded-md px-2 py-1.5 text-sm font-medium text-primary hover:bg-muted"
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

      {drawer}
    </>
  );
}
