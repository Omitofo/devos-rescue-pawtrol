/**
 * Organization user login — Email OTP or password (WP-03).
 * Password path unblocks local work when Supabase email is rate-limited.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  requestOrgOtp,
  verifyOrgOtp,
  orgPasswordLogin,
} from "@/lib/auth/actions";

type Mode = "otp" | "password";

export default function OrgLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [otpStep, setOtpStep] = useState<"email" | "code">("email");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function goWorkspace() {
    router.push("/workspace");
    router.refresh();
  }

  function onRequestCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await requestOrgOtp(email);
      if (result.ok) {
        setMessage(result.message ?? "Code sent.");
        setOtpStep("code");
      } else {
        setError(result.error);
      }
    });
  }

  function onVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await verifyOrgOtp(email, code);
      if (result.ok) goWorkspace();
      else setError(result.error);
    });
  }

  function onPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await orgPasswordLogin(email, password);
      if (result.ok) goWorkspace();
      else setError(result.error);
    });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 sm:p-6">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-surface-elevated p-6 shadow-sm sm:p-8">
        <div>
          <Link
            href="/"
            className="text-sm text-muted-foreground transition hover:text-primary"
          >
            &larr; Back to site
          </Link>
        </div>

        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-primary">
            Organization sign in
          </h1>
          <p className="text-sm text-muted-foreground">
            No public registration - admin-provisioned accounts only
          </p>
        </div>

        <div className="flex rounded-lg border border-border p-0.5 text-sm">
          <button
            type="button"
            onClick={() => {
              setMode("password");
              setError(null);
              setMessage(null);
            }}
            className={`flex-1 rounded-md px-3 py-1.5 ${
              mode === "password"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("otp");
              setError(null);
              setMessage(null);
            }}
            className={`flex-1 rounded-md px-3 py-1.5 ${
              mode === "otp"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            }`}
          >
            Email code
          </button>
        </div>

        {mode === "password" ? (
          <form onSubmit={onPassword} className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-primary">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent-2"
                placeholder="you@rescue.org"
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
              {pending ? "Signing in..." : "Sign in"}
            </button>
          </form>
        ) : otpStep === "email" ? (
          <form onSubmit={onRequestCode} className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-primary">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent-2"
                placeholder="you@rescue.org"
              />
            </label>
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {pending ? "Sending..." : "Send code"}
            </button>
          </form>
        ) : (
          <form onSubmit={onVerifyOtp} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Code sent to <strong className="text-primary">{email}</strong>
            </p>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-primary">One-time code</span>
              <input
                type="text"
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm tracking-widest outline-none focus:ring-2 focus:ring-accent-2"
                placeholder="123456"
              />
            </label>
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {pending ? "Verifying..." : "Verify & sign in"}
            </button>
            <button
              type="button"
              className="w-full text-sm text-muted-foreground underline"
              onClick={() => {
                setOtpStep("email");
                setCode("");
                setError(null);
              }}
            >
              Use a different email
            </button>
          </form>
        )}

        {message && (
          <p className="text-center text-sm text-accent-1">{message}</p>
        )}
        {error && <p className="text-center text-sm text-red-600">{error}</p>}

        <p className="text-center text-xs text-muted-foreground">
          Platform staff?{" "}
          <a href="/auth/admin/login" className="underline">
            Admin sign in
          </a>
        </p>
      </div>
    </main>
  );
}
