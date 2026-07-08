import { createPublicClient, http, formatUnits } from "viem";
import { xLayer } from "@/lib/chains";
import { XLAYER_TOKENS } from "@/lib/tokens";
import { getSpotPriceUSD } from "@/lib/okx-market";

const client = createPublicClient({ chain: xLayer, transport: http() });

const erc20Abi = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

// Maps our internal token symbols to the ticker OKX's market API expects.
const PRICE_TICKER: Record<string, string> = { OKB: "OKB", ETH: "ETH", WBTC: "BTC" };
const STABLES = ["USDC", "USDT", "DAI"];

// Matches the simulated lending APY in lib/agent/tools.ts. Real lending
// integration would source this from an actual protocol's contract.
const MOCK_LENDING_APY = 0.052;

export interface Holding {
  symbol: string;
  balance: number;
  usdValue: number;
}

export interface PortfolioResult {
  walletAddress: string;
  netWorth: number;
  holdings: Holding[];
  idleAssetsUsd: number;
  idleYieldPotentialPerDay: number;
  healthScore: number;
  suggestions: string[];
}

/**
 * Reads real balances for a wallet on X Layer mainnet and returns a
 * portfolio summary. Net worth and idle assets are real, on-chain figures.
 * Health score and yield potential are explicitly-labeled heuristics —
 * see the UI copy in app/portfolio/page.tsx for how these are presented.
 */
export async function getPortfolio(walletAddress: string): Promise<PortfolioResult> {
  const address = walletAddress as `0x${string}`;
  const holdings: Holding[] = [];

  for (const [symbol, token] of Object.entries(XLAYER_TOKENS)) {
    if (symbol === "WOKB") continue; // avoid double-counting alongside native OKB

    try {
      const rawBalance =
        symbol === "OKB"
          ? await client.getBalance({ address })
          : ((await client.readContract({
              address: token.address as `0x${string}`,
              abi: erc20Abi,
              functionName: "balanceOf",
              args: [address],
            })) as bigint);

      if (rawBalance === BigInt(0)) continue;

      const balance = Number(formatUnits(rawBalance, token.decimals));
      const price = await getSpotPriceUSD(PRICE_TICKER[symbol] ?? symbol);
      holdings.push({ symbol, balance, usdValue: balance * price });
    } catch (err) {
      console.error(`Failed to read ${symbol} balance:`, err);
      // Skip this token rather than failing the whole portfolio
    }
  }

  const netWorth = holdings.reduce((sum, h) => sum + h.usdValue, 0);
  const idleAssetsUsd = holdings
    .filter((h) => STABLES.includes(h.symbol))
    .reduce((sum, h) => sum + h.usdValue, 0);
  const idleYieldPotentialPerDay = (idleAssetsUsd * MOCK_LENDING_APY) / 365;

  let healthScore = 0;
  const suggestions: string[] = [];

  if (netWorth > 0) {
    const idleRatio = idleAssetsUsd / netWorth;
    const diversificationBonus = Math.min(holdings.length, 4) * 0.5;
    healthScore = Math.max(0, Math.min(10, 8 - idleRatio * 5 + diversificationBonus));
    healthScore = Math.round(healthScore * 10) / 10;

    if (idleAssetsUsd > 1) {
      suggestions.push(
        `Move $${idleAssetsUsd.toFixed(2)} idle stablecoins into lending — est. ${(MOCK_LENDING_APY * 100).toFixed(1)}% APY`
      );
    }
  } else {
    suggestions.push("No funds detected on X Layer mainnet yet — bridge or deposit to get started.");
  }

  return {
    walletAddress,
    netWorth,
    holdings,
    idleAssetsUsd,
    idleYieldPotentialPerDay,
    healthScore,
    suggestions,
  };
}