/**
 * Admin Console shell — staff gate only; chrome in root SiteHeader.
 */

import { requirePlatformStaff } from "@/lib/auth/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePlatformStaff();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
  );
}
