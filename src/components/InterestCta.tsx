/**
 * Primary interest CTA on animal detail — WP-05 (J-02).
 *
 * Records interest event then navigates to the org Contact section.
 */

"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { recordInterestEvent } from "@/lib/data/interest";

export function InterestCta({
  animalId,
  orgId,
  orgSlug,
  ctaText,
}: {
  animalId: string;
  orgId: string;
  orgSlug: string;
  ctaText: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const label = ctaText?.trim() || "Contact this rescue";

  function onClick() {
    startTransition(async () => {
      await recordInterestEvent(animalId, orgId);
      router.push(`/organizations/${orgSlug}#contact`);
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="w-full rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60 sm:w-auto"
    >
      {pending ? "Opening…" : label}
    </button>
  );
}
