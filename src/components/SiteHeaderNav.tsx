/**
 * Header chrome — desktop 3-zone layout, mobile cart + hamburger.
 *
 * Left: brand · Center: nav (normal weight, wider gaps) · Right: cart icon + CTA
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
    ? "text-sm font-normal text-primary underline underline-offset-4"
    : "text-sm font-normal text-primary hover:underline hover:underline-offset-4";
}

function CartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M6 6h15l-1.5 9h-12L6 6Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M6 6 5 3H2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="20" r="1.25" fill="currentColor" />
      <circle cx="18" cy="20" r="1.25" fill="currentColor" />
    </svg>
  );
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
                <span className="text-sm font-medium text-primary">Menu</span>
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
                    className="rounded-lg px-3 py-3 text-base font-normal text-primary hover:bg-muted"
                    onClick={() => setOpen(false)}
                  >
                    {l.label}
                  </Link>
                ))}
                <Link
                  href="/shop/cart"
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-3 text-base font-normal text-primary hover:bg-muted"
                  onClick={() => setOpen(false)}
                >
                  <CartIcon />
                  Cart{cartCount > 0 ? ` (${cartCount})` : ""}
                </Link>
                {!user && (
                  <Link
                    href="/auth/login"
                    className="mt-2 rounded-full bg-primary px-3 py-3 text-center text-base font-medium text-primary-foreground"
                    onClick={() => setOpen(false)}
                  >
                    Org sign in
                  </Link>
                )}
                {user && (
                  <div className="mt-3 border-t border-border px-1 pt-3">
                    {user.email && (
                      <p className="mb-2 truncate px-2 text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    )}
                    <form action={signOut.bind(null, signOutTo)}>
                      <button
                        type="submit"
                        className="w-full rounded-full border border-primary px-3 py-2.5 text-sm font-medium text-primary"
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
          className="pointer-events-none absolute inset-x-0 hidden items-center justify-center gap-8 md:flex lg:gap-12"
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
          <div className="hidden items-center gap-3 md:flex sm:gap-4">
            <Link
              href="/shop/cart"
              className={`inline-flex items-center gap-1.5 text-sm font-normal text-primary hover:opacity-80 ${
                cartActive ? "underline underline-offset-4" : ""
              }`}
              aria-label={
                cartCount > 0 ? `Cart, ${cartCount} items` : "Cart"
              }
            >
              <CartIcon />
              <span className="hidden sm:inline">
                Cart{cartCount > 0 ? ` (${cartCount})` : ""}
              </span>
              {cartCount > 0 && (
                <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-medium leading-5 text-primary-foreground sm:hidden">
                  {cartCount}
                </span>
              )}
            </Link>

            {!user && (
              <Link
                href="/auth/login"
                className="inline-flex items-center rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
              >
                Org sign in
              </Link>
            )}
            {user && (
              <form action={signOut.bind(null, signOutTo)}>
                <button
                  type="submit"
                  className="inline-flex items-center rounded-full border border-primary bg-transparent px-4 py-1.5 text-sm font-medium text-primary transition hover:bg-primary hover:text-primary-foreground"
                >
                  Sign out
                </button>
              </form>
            )}
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <Link
              href="/shop/cart"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-primary hover:bg-muted"
              aria-label={
                cartCount > 0 ? `Cart, ${cartCount} items` : "Cart"
              }
            >
              <CartIcon />
              {cartCount > 0 && (
                <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                  {cartCount}
                </span>
              )}
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
