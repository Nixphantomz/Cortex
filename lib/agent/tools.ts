import type { ActionCardData } from "@/lib/types";
import { resolveToken } from "@/lib/tokens";
import { getSwapQuote } from "@/lib/okx-dex";
import { toRawAmount, fromRawAmount } from "@/lib/amount";

export type ToolName = "get_swap_quote" | "get_lending_rate" | "get_borrow_rate";

// Scales decimal places to the size of the number so tiny ETH/BTC amounts
// don't get rounded to 0.00 and large stablecoin amounts don't show noise.
function formatAmount(n: number): string {
  if (n === 0) return "0";
  if (n < 0.01) return n.toFixed(6);
  if (n < 1) return n.toFixed(4);
  return n.toFixed(2);
}

export const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_swap_quote",
      description:
        "Get the best swap route and quote for exchanging one token for another.",
      parameters: {
        type: "object",
        properties: {
          fromToken: { type: "string", description: "Token symbol being sold, e.g. USDC" },
          toToken: { type: "string", description: "Token symbol being bought, e.g. ETH" },
          amount: { type: "number", description: "Amount of fromToken to swap" },
        },
        required: ["fromToken", "toToken", "amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_lending_rate",
      description:
        "Get the best lending/supply rate for depositing a token into a money market.",
      parameters: {
        type: "object",
        properties: {
          token: { type: "string" },
          amount: { type: "number" },
        },
        required: ["token", "amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_borrow_rate",
      description:
        "Get the best borrow rate for borrowing a token against existing collateral.",
      parameters: {
        type: "object",
        properties: {
          token: { type: "string" },
          amount: { type: "number" },
        },
        required: ["token", "amount"],
      },
    },
  },
] as const;

interface ToolResult {
  data: Record<string, unknown>;
  card: ActionCardData;
}

export async function executeTool(name: ToolName, args: any): Promise<ToolResult> {
  switch (name) {
    case "get_swap_quote": {
      const { fromToken, toToken, amount } = args;

      if (fromToken.toUpperCase() === toToken.toUpperCase()) {
        throw new Error(`${fromToken.toUpperCase()} and ${toToken.toUpperCase()} are the same token — nothing to swap.`);
      }
      if (!(amount > 0)) {
        throw new Error("Amount must be greater than zero.");
      }

      const from = resolveToken(fromToken);
      const to = resolveToken(toToken);
      const rawAmount = toRawAmount(amount, from.decimals);

      const quote = await getSwapQuote(from.address, to.address, rawAmount);
      const outputAmount = fromRawAmount(quote.toTokenAmount, to.decimals);
      const router = quote.dexRouterList?.[0]?.router ?? "OKX DEX Aggregator";

      const data = {
        protocol: router,
        estimatedOutput: `${formatAmount(outputAmount)} ${toToken.toUpperCase()}`,
        networkFee: quote.estimateGasFee
          ? `${formatAmount(fromRawAmount(quote.estimateGasFee, 18))} OKB`
          : "~$0.01",
        risk: "Low" as const,
      };

      return {
        data,
        card: {
          kind: "swap",
          protocol: data.protocol,
          summary: `${amount} ${fromToken.toUpperCase()} → ${toToken.toUpperCase()}`,
          estimatedOutput: data.estimatedOutput,
          networkFee: data.networkFee,
          risk: "Low",
          status: "pending",
        },
      };
    }
    case "get_lending_rate": {
      const { token, amount } = args;
      const data = { protocol: "Aave V3 (simulated)", apy: "5.2%", networkFee: "$0.05", risk: "Low" };
      return {
        data,
        card: {
          kind: "lend",
          protocol: data.protocol,
          summary: `Supply ${amount} ${token}`,
          estimatedOutput: `${data.apy} APY`,
          networkFee: data.networkFee,
          risk: "Low",
          status: "pending",
        },
      };
    }
    case "get_borrow_rate": {
      const { token, amount } = args;
      const data = { protocol: "Aave V3 (simulated)", apr: "3.8%", networkFee: "$0.05", risk: "Medium" };
      return {
        data,
        card: {
          kind: "borrow",
          protocol: data.protocol,
          summary: `Borrow ${amount} ${token}`,
          estimatedOutput: `${data.apr} variable APR`,
          networkFee: data.networkFee,
          risk: "Medium",
          status: "pending",
        },
      };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}