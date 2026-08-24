/**
 * Logo + wordmark → home, always scrolled to top.
 * On "/" Next.js Link would no-op; we force window scroll instead.
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  className?: string;
  children: React.ReactNode;
};

export function HomeBrandLink({ className, children }: Props) {
  const pathname = usePathname();

  return (
    <Link
      href="/"
      scroll
      className={className}
      onClick={(e) => {
        if (pathname === "/") {
          e.preventDefault();
          window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
          return;
        }
      }}
    >
      {children}
    </Link>
  );
}
