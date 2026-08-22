/**
 * Mock POD provider — WP-10.
 *
 * Used when no real POD API keys are configured.
 * Issues a deterministic fake pod_order_id so the fulfilment path
 * can be exercised end-to-end in local/dev.
 */

import type { PodProvider, PodSubmitRequest, PodSubmitResult } from "../types";
import { logger } from "@/lib/logger";

export const mockProvider: PodProvider = {
  name: "mock",

  isConfigured() {
    return true;
  },

  async submitOrder(req: PodSubmitRequest): Promise<PodSubmitResult> {
    const podOrderId = `mock_${req.orderId.replace(/-/g, "").slice(0, 16)}`;
    logger.info("pod.mock_submit", {
      orderId: req.orderId,
      podOrderId,
      lines: req.items.length,
    });
    return {
      ok: true,
      provider: "mock",
      podOrderId,
      podStatus: "submitted",
      raw: { simulated: true, items: req.items.length },
    };
  },
};
