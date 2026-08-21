/**
 * Organization user login — Email OTP (WP-03).
 *
 * Flow:
 * 1. User enters email → requestOrgOtp
 * 2. User enters code → verifyOrgOtp (opens elevated window)
 * 3. Redirect to / (or a future /workspace path)
 *
 * No self-registration: shouldCreateUser is false (FR-07).
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestOrgOtp, verifyOrgOtp } from "@/lib/auth/actions";

export default function OrgLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onRequestCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await requestOrgOtp(email);
      if (result.ok) {
        setMessage(result.message ?? "Code sent.");
        setStep("code");
      } else {
        setError(result.error);
      }
    });
  }

  function onVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await verifyOrgOtp(email, code);
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
            Organization sign in
          </h1>
          <p className="text-sm text-muted-foreground">
            Email one-time code · no public registration
          </p>
        </div>

        {step === "email" ? (
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
              {pending ? "Sending…" : "Send code"}
            </button>
          </form>
        ) : (
          <form onSubmit={onVerify} className="space-y-4">
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
              {pending ? "Verifying…" : "Verify & sign in"}
            </button>
            <button
              type="button"
              className="w-full text-sm text-muted-foreground underline"
              onClick={() => {
                setStep("email");
                setCode("");
                setError(null);
                setMessage(null);
              }}
            >
              Use a different email
            </button>
          </form>
        )}

        {message && (
          <p className="text-center text-sm text-accent-1">{message}</p>
        )}
        {error && (
          <p className="text-center text-sm text-red-600">{error}</p>
        )}
      </div>
    </main>
  );
}
