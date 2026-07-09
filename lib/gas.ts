import { createPublicClient, http, formatUnits } from "viem";
import { xLayer } from "@/lib/chains";

const client = createPublicClient({ chain: xLayer, transport: http() });

/**
 * OKX's quote response returns estimateGasFee as a GAS UNIT count
 * (e.g. "135000"), not a wei-denominated fee — confirmed against OKX's
 * own documented example responses. This multiplies it by X Layer's
 * current live gas price to get an actual OKB fee estimate.
 */
export async function estimateNetworkFeeOKB(gasUnits: string | number): Promise<number> {
  try {
    const gasPrice = await client.getGasPrice(); // wei per gas unit, live
    const feeWei = BigInt(gasUnits) * gasPrice;
    return Number(formatUnits(feeWei, 18));
  } catch (err) {
    console.error("Failed to estimate network fee:", err);
    return 0;
  }
}