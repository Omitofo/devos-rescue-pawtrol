/**
 * POD (print-on-demand) adapter types — WP-10.
 *
 * Multi-provider ready: Gelato → Printify → Printful (preference order).
 * Real HTTP integrations plug in behind the same interface when API keys exist.
 */

export type PodProviderName = "gelato" | "printify" | "printful" | "mock";

export type PodLineItem = {
  productName: string;
  quantity: number;
  unitPriceCents: number;
  /** Provider-specific SKU / variant when mapped in product.metadata */
  providerSku?: string | null;
  metadata?: Record<string, unknown>;
};

export type PodShippingAddress = {
  name?: string;
  line1?: string;
  city?: string;
  postal?: string;
  country?: string;
  email?: string;
};

export type PodSubmitRequest = {
  orderId: string;
  currency: string;
  items: PodLineItem[];
  shipping: PodShippingAddress;
};

export type PodSubmitResult =
  | {
      ok: true;
      provider: PodProviderName;
      podOrderId: string;
      podStatus: string;
      raw?: unknown;
    }
  | {
      ok: false;
      provider: PodProviderName;
      error: string;
    };

export interface PodProvider {
  readonly name: PodProviderName;
  /** True when env credentials are present for this provider */
  isConfigured(): boolean;
  submitOrder(req: PodSubmitRequest): Promise<PodSubmitResult>;
}
