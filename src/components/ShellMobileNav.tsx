/**
 * Hamburger nav for app shells (workspace / admin) on mobile.
 * Drawer is portaled to document.body so header backdrop-filter cannot trap it.
 */

"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type ShellLink = {
  href: string;
  label: string;
};

type Props = {
  links: ShellLink[];
  footer?: React.ReactNode;
  status?: React.ReactNode;
};

export function ShellMobileNav({ links, footer, status }: Props) {
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

  const drawer =
    open && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[200] md:hidden"
            id="shell-mobile-nav"
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
              <nav className="flex flex-1 flex-col gap-1 overflow-y-auto bg-white p-3">
                {links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="rounded-lg px-3 py-3 text-base font-medium text-primary hover:bg-muted"
                    onClick={() => setOpen(false)}
                  >
                    {l.label}
                  </Link>
                ))}
                {status && (
                  <div className="mt-2 border-t border-border px-3 pt-3">{status}</div>
                )}
              </nav>
              {footer && (
                <div className="shrink-0 border-t border-border bg-white p-4">{footer}</div>
              )}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div className="hidden items-center gap-3 md:flex">
        <nav className="flex items-center gap-3 text-sm text-muted-foreground">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-primary">
              {l.label}
            </Link>
          ))}
        </nav>
        {status}
        {footer}
      </div>

      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-md text-primary hover:bg-muted md:hidden"
        aria-expanded={open}
        aria-controls="shell-mobile-nav"
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

      {drawer}
    </>
  );
}
