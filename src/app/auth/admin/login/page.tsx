/**
 * Platform staff login — Email + password (WP-03).
 *
 * MFA should be enforced via Supabase Auth settings for these accounts.
 * Only users with role platform_admin or platform_moderator are accepted.
 */

"use client";

import { useState, useTransition } from "react";
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
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-surface-elevated p-8 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-primary">
            Admin sign in
          </h1>
          <p className="text-sm text-muted-foreground">
            Platform staff only · MFA recommended
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
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {error && (
          <p className="text-center text-sm text-red-600">{error}</p>
        )}
      </div>
    </main>
  );
}
