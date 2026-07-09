import { createPublicClient, http } from "viem";
import { xLayer } from "@/lib/chains";

// wagmi's usePublicClient() hook returns a client with multicall batching
// enabled (likely via RainbowKit's config defaults), which threw an
// internal error on X Layer specifically. This plain client — matching
// exactly what lib/agent/portfolio.ts already uses successfully — avoids
// that batching path entirely for client-side reads and tx-receipt waits.
export const xLayerPublicClient = createPublicClient({
  chain: xLayer,
  transport: http(),
});