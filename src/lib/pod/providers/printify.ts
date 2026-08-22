/**
 * Printify POD provider — WP-10 (2nd preference).
 * Stub until PRINTIFY_API_TOKEN + shop id + blueprint mapping exist.
 */

import type { PodProvider, PodSubmitRequest, PodSubmitResult } from "../types";
import { logger } from "@/lib/logger";

export const printifyProvider: PodProvider = {
  name: "printify",

  isConfigured() {
    return Boolean(
      process.env.PRINTIFY_API_TOKEN?.trim() &&
        process.env.PRINTIFY_SHOP_ID?.trim()
    );
  },

  async submitOrder(req: PodSubmitRequest): Promise<PodSubmitResult> {
    if (!this.isConfigured()) {
      return {
        ok: false,
        provider: "printify",
        error: "PRINTIFY_API_TOKEN / PRINTIFY_SHOP_ID not configured",
      };
    }
    logger.warn("pod.printify_not_implemented", { orderId: req.orderId });
    return {
      ok: false,
      provider: "printify",
      error:
        "Printify key is set but live API client is not implemented yet. Clear keys to use mock.",
    };
  },
};
