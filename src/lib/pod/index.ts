/**
 * POD provider selection — WP-10.
 *
 * Preference: Gelato → Printify → Printful → mock.
 * Set POD_FORCE_MOCK=1 to always use mock (useful in CI / local).
 */

import type { PodProvider, PodProviderName } from "./types";
import { gelatoProvider } from "./providers/gelato";
import { printifyProvider } from "./providers/printify";
import { printfulProvider } from "./providers/printful";
import { mockProvider } from "./providers/mock";

const CHAIN: PodProvider[] = [
  gelatoProvider,
  printifyProvider,
  printfulProvider,
  mockProvider,
];

export function getPodProvider(): PodProvider {
  if (process.env.POD_FORCE_MOCK === "1") {
    return mockProvider;
  }
  for (const p of CHAIN) {
    if (p.name === "mock") return p;
    if (p.isConfigured()) return p;
  }
  return mockProvider;
}

export function getPodProviderStatus(): {
  active: PodProviderName;
  configured: PodProviderName[];
  note: string;
} {
  const configured = CHAIN.filter(
    (p) => p.name !== "mock" && p.isConfigured()
  ).map((p) => p.name);
  const active = getPodProvider().name;
  const note =
    active === "mock"
      ? "No live POD keys (or POD_FORCE_MOCK=1). Fulfilment uses mock provider — safe for local/dev."
      : `Live provider selected: ${active}. HTTP client may still be a stub until SKUs are mapped.`;
  return { active, configured, note };
}

export type {
  PodProvider,
  PodProviderName,
  PodSubmitRequest,
  PodSubmitResult,
  PodLineItem,
  PodShippingAddress,
} from "./types";
