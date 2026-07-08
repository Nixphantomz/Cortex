/**
 * X Layer Mainnet (chainId 196) token addresses.
 * Source of truth: https://github.com/okx/xlayer-tokenlist
 *
 * IMPORTANT: X Layer's native gas token is OKB, not ETH. "ETH" here maps
 * to xETH — OKX's wrapped ETH representation on X Layer — not the chain's
 * native currency. The 0xEeee...EEeE address is the EVM convention OKX's
 * DEX API uses to mean "the chain's native token" (OKB in this case).
 */
export const XLAYER_TOKENS: Record<string, { address: string; decimals: number }> = {
  OKB: { address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", decimals: 18 }, // native
  WOKB: { address: "0xe538905cf8410324e03A5A23C1c177a474D59b2b", decimals: 18 },
  USDC: { address: "0x74b7F16337b8972027F6196A17a631aC6dE26d22", decimals: 6 },
  USDT: { address: "0x779Ded0c9e1022225f8E0630b35a9b54bE713736", decimals: 6 }, // USDT0, canonical
  DAI: { address: "0xC5015b9d9161Dca7e18e32f6f25C4aD850731Fd4", decimals: 18 },
  ETH: { address: "0xE7B000003A45145decf8a28FC755aD5eC5EA025A", decimals: 18 }, // xETH
  WBTC: { address: "0xb7c00000bcdeef966b20b3d884b98e64d2b06b4f", decimals: 8 }, // xBTC
};

export function resolveToken(symbol: string) {
  const token = XLAYER_TOKENS[symbol.toUpperCase()];
  if (!token) {
    throw new Error(
      `"${symbol}" isn't a token Cortex knows on X Layer yet. Supported: ${Object.keys(XLAYER_TOKENS).join(", ")}`
    );
  }
  return token;
}