/**
 * Printful POD provider — WP-10 (3rd preference).
 * Stub until PRINTFUL_API_KEY + variant IDs exist.
 */

import type { PodProvider, PodSubmitRequest, PodSubmitResult } from "../types";
import { logger } from "@/lib/logger";

export const printfulProvider: PodProvider = {
  name: "printful",

  isConfigured() {
    return Boolean(process.env.PRINTFUL_API_KEY?.trim());
  },

  async submitOrder(req: PodSubmitRequest): Promise<PodSubmitResult> {
    if (!this.isConfigured()) {
      return {
        ok: false,
        provider: "printful",
        error: "PRINTFUL_API_KEY not configured",
      };
    }
    logger.warn("pod.printful_not_implemented", { orderId: req.orderId });
    return {
      ok: false,
      provider: "printful",
      error:
        "Printful key is set but live API client is not implemented yet. Clear key to use mock.",
    };
  },
};
