/**
 * Organization user login — Email OTP or password (WP-03).
 * Password path unblocks local work when Supabase email is rate-limited.
 *
 * Layout: form left · emotional image right (desktop).
 * Image: public/brand/login-hero.jpg (dog + cat).
 * Card sized to fit typical viewports without scrolling.
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

const LOGIN_HERO_SRC = "/brand/login-hero.jpg";

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
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#FFF8F0] p-3 sm:p-4">
      <div className="mx-auto grid w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-sm lg:max-h-[min(32rem,calc(100dvh-2rem))] lg:grid-cols-2">
        <div className="flex flex-col justify-center space-y-4 p-5 sm:p-6 lg:overflow-y-auto">
          <div>
            <Link
              href="/"
              className="text-sm text-muted-foreground transition hover:text-primary"
            >
              &larr; Back to site
            </Link>
          </div>

          <div className="space-y-1">
            <h1 className="text-lg font-semibold tracking-tight text-primary sm:text-xl">
              Organization sign in
            </h1>
            <p className="text-sm text-muted-foreground">
              No public registration — admin-provisioned accounts only
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
            <form onSubmit={onPassword} className="space-y-3">
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
            <form onSubmit={onRequestCode} className="space-y-3">
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
            <form onSubmit={onVerifyOtp} className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Code sent to <strong className="text-primary">{email}</strong>
              </p>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-primary">
                  One-time code
                </span>
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

        <div className="relative hidden bg-muted lg:block lg:min-h-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGIN_HERO_SRC}
            alt="Dog and cat — rescue companions"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent"
            aria-hidden
          />
          <p className="absolute bottom-4 left-4 right-4 text-xs font-medium text-white drop-shadow sm:text-sm">
            Real animals. Real rescues. You&apos;re part of the mission.
          </p>
        </div>
      </div>
    </main>
  );
}
