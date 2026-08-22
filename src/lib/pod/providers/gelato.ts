/**
 * Gelato POD provider — WP-10 (preferred).
 *
 * Stub: activates only when GELATO_API_KEY is set.
 * Real API calls will be added when credentials are available.
 */

import type { PodProvider, PodSubmitRequest, PodSubmitResult } from "../types";
import { logger } from "@/lib/logger";

export const gelatoProvider: PodProvider = {
  name: "gelato",

  isConfigured() {
    return Boolean(process.env.GELATO_API_KEY?.trim());
  },

  async submitOrder(req: PodSubmitRequest): Promise<PodSubmitResult> {
    if (!this.isConfigured()) {
      return {
        ok: false,
        provider: "gelato",
        error: "GELATO_API_KEY not configured",
      };
    }

    logger.warn("pod.gelato_not_implemented", {
      orderId: req.orderId,
      note: "API key present but HTTP client not wired yet — use mock or map SKUs",
    });
    return {
      ok: false,
      provider: "gelato",
      error:
        "Gelato key is set but live API client is not implemented yet. Clear GELATO_API_KEY to use mock, or finish SKU mapping.",
    };
  },
};
