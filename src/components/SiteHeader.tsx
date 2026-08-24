/**
 * Universal app header — same chrome on discovery, shop, workspace, admin.
 *
 * Left: logo + name → home (animals) + scroll top
 * Center/right: stable public links, cart always visible, role links
 */

import { getAuthUser } from "@/lib/auth/session";
import { readCartItems } from "@/lib/shop/cart";
import { SiteHeaderNav } from "@/components/SiteHeaderNav";
import { HomeBrandLink } from "@/components/HomeBrandLink";

export async function SiteHeader() {
  const user = await getAuthUser();
  let cartCount = 0;
  try {
    const items = await readCartItems();
    cartCount = items.reduce((n, i) => n + i.quantity, 0);
  } catch {
    cartCount = 0;
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 header-glass">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-3 sm:h-16 sm:px-6">
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

          <SiteHeaderNav
            user={
              user
                ? { role: user.role, email: user.email ?? null }
                : null
            }
            cartCount={cartCount}
          />
        </div>
      </header>
      <div className="h-14 shrink-0 sm:h-16" aria-hidden />
    </>
  );
}
