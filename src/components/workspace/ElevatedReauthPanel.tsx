/**
 * Elevated re-auth prompt — WP-06 (E-08).
 * Reuses org OTP without forcing a full logout of the normal session.
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestOrgOtp, verifyOrgOtp } from "@/lib/auth/actions";

export function ElevatedReauthPanel({ email }: { email: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"idle" | "code">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function requestCode() {
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

  function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await verifyOrgOtp(email, code);
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
      <p className="font-medium">Elevated verification required</p>
      <p className="mt-1 text-amber-900/80">
        To create or edit listings, confirm your identity with a one-time code.
        This keeps an unattended browser from changing public data. The window
        lasts 15 minutes.
      </p>

      {step === "idle" ? (
        <button
          type="button"
          onClick={requestCode}
          disabled={pending}
          className="mt-3 rounded-md bg-amber-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
        >
          {pending ? "Sending…" : `Send code to ${email}`}
        </button>
      ) : (
        <form onSubmit={verify} className="mt-3 flex flex-wrap items-end gap-2">
          <label className="space-y-1">
            <span className="text-xs font-medium">Code</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="block rounded-md border border-amber-300 bg-white px-2 py-1.5 text-sm"
              placeholder="123456"
              required
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-amber-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
          >
            {pending ? "Verifying…" : "Unlock editing"}
          </button>
        </form>
      )}

      {message && <p className="mt-2 text-xs text-amber-800">{message}</p>}
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
    </div>
  );
}
