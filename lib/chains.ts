import { defineChain } from "viem";

/**
 * Both X Layer chains are hand-defined here rather than imported from
 * viem/chains, for two separate reasons:
 *
 * 1. Testnet: viem's bundled definition can lag behind real network
 *    migrations — X Layer's testnet was recently rebuilt as "Terigon"
 *    with a new chain ID (1952).
 * 2. Mainnet: viem's default RPC URL is xlayerrpc.okx.com — an okx.com
 *    subdomain that's unreachable without a VPN from regions where OKX
 *    is geo-blocked (confirmed: Nigeria). X Layer has a second official
 *    RPC on a different domain, rpc.xlayer.tech, which isn't caught by
 *    that same block. Listing it first means our client (and wagmi's)
 *    uses it as the primary endpoint automatically.
 *
 * Source: https://web3.okx.com/xlayer/docs/developer/rpc-endpoints/rpc-endpoints
 */
export const xLayer = defineChain({
  id: 196,
  name: "X Layer",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.xlayer.tech", "https://xlayerrpc.okx.com"] },
  },
  blockExplorers: {
    default: { name: "OKLink", url: "https://www.oklink.com/xlayer" },
  },
});

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