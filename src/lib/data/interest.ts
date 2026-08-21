"use server";

/**
 * Interest / CTA event write — WP-05 (FR-05, FR-17).
 *
 * No PII. Anyone can insert (RLS policy).
 * Also records a matching analytics_events row for the day-one set.
 */

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export async function recordInterestEvent(
  animalId: string,
  orgId: string
): Promise<{ ok: boolean }> {
  const supabase = await createClient();

  const { error: interestError } = await supabase.from("interest_events").insert({
    animal_id: animalId,
    org_id: orgId,
  });

  if (interestError) {
    logger.error("interest.insert_failed", { animalId, orgId }, interestError);
    return { ok: false };
  }

  // Best-effort analytics event (do not fail the CTA if this fails)
  await supabase.from("analytics_events").insert({
    event_type: "interest_cta",
    animal_id: animalId,
    org_id: orgId,
  });

  logger.info("interest.recorded", { animalId, orgId });
  return { ok: true };
}
