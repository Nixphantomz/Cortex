// Public market data: https://www.okx.com/docs-v5/en/#public-data-rest-api
// No authentication required for these endpoints, unlike the DEX aggregator.
const STABLECOINS = new Set(["USDC", "USDT", "DAI", "USDG"]);

// Maps our internal token symbols to the ticker OKX's market API expects
// (e.g. our "WBTC"/"xBTC" both mean the market's "BTC" ticker).
const TICKER_MAP: Record<string, string> = { OKB: "OKB", WOKB: "OKB", ETH: "ETH", WETH: "ETH", WBTC: "BTC" };

export function resolveTicker(symbol: string): string {
  const upper = symbol.toUpperCase();
  return TICKER_MAP[upper] ?? upper;
}

export async function getSpotPriceUSD(tickerSymbol: string): Promise<number> {
  const upper = tickerSymbol.toUpperCase();
  if (STABLECOINS.has(upper)) return 1; // pegged, not worth a network call

  try {
    const res = await fetch(`https://www.okx.com/api/v5/market/ticker?instId=${upper}-USDT`);
    const json = await res.json();
    const price = parseFloat(json?.data?.[0]?.last);
    return Number.isFinite(price) ? price : 0;
  } catch {
    return 0; // fail safe — better to show $0 for one asset than crash the whole portfolio
  }
}