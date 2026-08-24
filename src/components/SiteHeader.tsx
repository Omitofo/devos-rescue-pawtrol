/**
 * Universal app header — 3 zones on desktop:
 * left brand (home) · center primary links · right cart + account
 */

import { cache } from "react";
import { getAuthUser } from "@/lib/auth/session";
import { readCartItems } from "@/lib/shop/cart";
import { SiteHeaderNav } from "@/components/SiteHeaderNav";
import { HomeBrandLink } from "@/components/HomeBrandLink";

const headerMountState = cache(() => ({ mounted: false }));

export async function SiteHeader() {
  const state = headerMountState();
  if (state.mounted) {
    return null;
  }
  state.mounted = true;

  const user = await getAuthUser();
  let cartCount = 0;
  try {
    const items = await readCartItems();
    cartCount = items.reduce((n, i) => n + i.quantity, 0);
  } catch {
    cartCount = 0;
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 header-glass">
      <SiteHeaderNav
        user={user ? { role: user.role, email: user.email ?? null } : null}
        cartCount={cartCount}
        brand={
          <HomeBrandLink className="flex min-w-0 items-center gap-2 text-base font-semibold tracking-tight text-primary sm:gap-2.5 sm:text-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo.png"
              alt=""
              width={40}
              height={40}
              className="h-8 w-8 shrink-0 object-contain sm:h-10 sm:w-10"
            />
            <span className="truncate">Rescue Pawtrol</span>
          </HomeBrandLink>
        }
      />
    </header>
  );
}
