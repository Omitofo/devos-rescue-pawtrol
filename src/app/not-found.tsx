/**
 * Global 404 — WP-05 (E-02).
 */

import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <main className="mx-auto flex max-w-6xl flex-col items-center px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-semibold text-primary">Not available</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          This page or listing is not available. It may have been adopted or
          removed.
        </p>
        <Link
          href="/"
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Browse animals
        </Link>
      </main>
    </>
  );
}
