/**
 * Aave V3 on X Layer mainnet — verified against the official DAO address
 * book: https://github.com/aave-dao/aave-address-book/blob/main/src/AaveV3XLayer.sol
 * Cross-checked: underlying token addresses here match lib/tokens.ts exactly
 * for USDT, WBTC (xBTC), WOKB, and ETH (xETH).
 */
export const AAVE_POOL_ADDRESS = "0xE3F3Caefdd7180F884c01E57f65Df979Af84f116";
export const AAVE_DATA_PROVIDER_ADDRESS = "0x6C505C31714f14e8af2A03633EB2Cdfb4959138F";

export const AAVE_POOL_ABI = [
  {
    name: "supply",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "onBehalfOf", type: "address" },
      { name: "referralCode", type: "uint16" },
    ],
    outputs: [],
  },
  {
    name: "borrow",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "interestRateMode", type: "uint256" },
      { name: "referralCode", type: "uint16" },
      { name: "onBehalfOf", type: "address" },
    ],
    outputs: [],
  },
] as const;

// AaveProtocolDataProvider's getReserveData — the stable, UI-facing helper
// interface (more consistent across Aave versions than the Pool's raw struct).
export const AAVE_DATA_PROVIDER_ABI = [
  {
    name: "getReserveData",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "asset", type: "address" }],
    outputs: [
      { name: "unbacked", type: "uint256" },
      { name: "accruedToTreasuryScaled", type: "uint256" },
      { name: "totalAToken", type: "uint256" },
      { name: "totalStableDebt", type: "uint256" },
      { name: "totalVariableDebt", type: "uint256" },
      { name: "liquidityRate", type: "uint256" },
      { name: "variableBorrowRate", type: "uint256" },
      { name: "stableBorrowRate", type: "uint256" },
      { name: "averageStableBorrowRate", type: "uint256" },
      { name: "liquidityIndex", type: "uint256" },
      { name: "variableBorrowIndex", type: "uint256" },
      { name: "lastUpdateTimestamp", type: "uint40" },
    ],
  },
] as const;

// Which of our existing tokens (lib/tokens.ts) are real, listed Aave
// reserves on X Layer, and whether each is enabled for borrowing.
// Source: the ARFC deployment proposal's parameter table.
export const AAVE_RESERVES: Record<string, { borrowable: boolean }> = {
  USDT: { borrowable: true },
  WBTC: { borrowable: true }, // xBTC underlying
  WOKB: { borrowable: false },
  ETH: { borrowable: true }, // xETH underlying
};

export function isAaveReserve(symbol: string): boolean {
  return symbol.toUpperCase() in AAVE_RESERVES;
}

export function isAaveBorrowable(symbol: string): boolean {
  return AAVE_RESERVES[symbol.toUpperCase()]?.borrowable ?? false;
}

// Ray-unit (1e27) rate to a simple percentage APY string, e.g. "5.23%".
// Aave expresses currentLiquidityRate/currentVariableBorrowRate as an
// already-annualized rate — this is a simple (non-compounded) conversion,
// close enough for display purposes without adding compounding math.
export function rayToApyString(rayRate: bigint): string {
  const apy = (Number(rayRate) / 1e27) * 100;
  return `${apy.toFixed(2)}%`;
}