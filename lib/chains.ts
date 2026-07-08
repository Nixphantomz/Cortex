import { xLayer } from "viem/chains";
import { defineChain } from "viem";

/**
 * viem ships an `xLayerTestnet` too, but third-party chain packages can lag
 * behind real network migrations — X Layer's testnet was recently rebuilt
 * as "Terigon" with a new chain ID (1952). Defining it by hand from OKX's
 * current official docs avoids depending on a possibly-stale package version.
 * Source: https://web3.okx.com/xlayer/docs/developer/rpc-endpoints/rpc-endpoints
 */
export const xLayerTestnet = defineChain({
  id: 1952,
  name: "X Layer Testnet",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testrpc.xlayer.tech/terigon"] },
  },
  blockExplorers: {
    default: { name: "OKLink", url: "https://www.oklink.com/xlayer-test" },
  },
  testnet: true,
});

export { xLayer };