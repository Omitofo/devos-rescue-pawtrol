/**
 * Platform staff login — Email + password (WP-03).
 *
 * MFA should be enforced via Supabase Auth settings for these accounts.
 * Only users with role platform_admin or platform_moderator are accepted.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminPasswordLogin } from "@/lib/auth/actions";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await adminPasswordLogin(email, password);
      if (result.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 sm:p-6">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-surface-elevated p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/"
            className="text-sm text-muted-foreground transition hover:text-primary"
          >
            {("\u2190")} Back to site
          </Link>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
          >
            Previous page
          </button>
        </div>

        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-primary">
            Admin sign in
          </h1>
          <p className="text-sm text-muted-foreground">
            Platform staff only \u00b7 MFA recommended
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-primary">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent-2"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-primary">Password</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent-2"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {pending ? "Signing in\u2026" : "Sign in"}
          </button>
        </form>

        {error && (
          <p className="text-center text-sm text-red-600">{error}</p>
        )}
      </div>
    </main>
  );
}
