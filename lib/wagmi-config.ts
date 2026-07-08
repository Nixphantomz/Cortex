import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { xLayer, xLayerTestnet } from "./chains";

// Testnet listed first so wallets default to it — safer while we're still
// building. Real execution (Phase 4 Part B) will require switching to
// mainnet, since OKX's DEX aggregator only has liquidity there.
export const wagmiConfig = getDefaultConfig({
  appName: "Cortex",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "",
  chains: [xLayerTestnet, xLayer],
  ssr: true,
});