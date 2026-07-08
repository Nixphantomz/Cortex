import type { ActionCardData, ActionKind } from "./types";

interface AgentResponse {
  reply: string;
  card?: ActionCardData;
}

function detectKind(input: string): ActionKind {
  const lower = input.toLowerCase();
  if (lower.includes("swap") || lower.includes("trade") || lower.includes("convert")) return "swap";
  if (lower.includes("lend") || lower.includes("supply") || lower.includes("deposit")) return "lend";
  if (lower.includes("borrow")) return "borrow";
  return "unknown";
}

// Pulls the first number in the string as a rough "amount", falls back to 100.
function detectAmount(input: string): number {
  const match = input.match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[1]) : 100;
}

function detectToken(input: string, fallback: string): string {
  const match = input.toUpperCase().match(/\b(USDC|USDT|ETH|WETH|WBTC|OKB|DAI)\b/g);
  if (!match) return fallback;
  return match[0];
}

/**
 * Simulates what Cortex's agent brain will eventually do:
 * parse natural-language intent → propose a concrete, reviewable action.
 * Replace the body of this function in Phase 3 with a real LLM call;
 * keep the return shape identical so ChatPanel doesn't need to change.
 */
export async function generateAgentResponse(input: string): Promise<AgentResponse> {
  const kind = detectKind(input);
  const amount = detectAmount(input);
  const fromToken = detectToken(input, "USDC");
  const toToken = kind === "swap" ? (fromToken === "ETH" ? "USDC" : "ETH") : fromToken;

  await wait(650); // mimic route-finding latency

  switch (kind) {
    case "swap":
      return {
        reply: "Analyzing liquidity across pools…",
        card: {
          kind: "swap",
          protocol: "Uniswap V4",
          summary: `${amount} ${fromToken} → ${toToken}`,
          estimatedOutput: `${(amount * 0.9942).toFixed(2)} ${toToken}`,
          networkFee: "$0.03",
          risk: "Low",
          status: "pending",
        },
      };
    case "lend":
      return {
        reply: "Checking lending markets for the best rate…",
        card: {
          kind: "lend",
          protocol: "Aave V3",
          summary: `Supply ${amount} ${fromToken}`,
          estimatedOutput: "5.2% APY",
          networkFee: "$0.05",
          risk: "Low",
          status: "pending",
        },
      };
    case "borrow":
      return {
        reply: "Evaluating collateral and borrow limits…",
        card: {
          kind: "borrow",
          protocol: "Aave V3",
          summary: `Borrow ${amount} ${fromToken}`,
          estimatedOutput: "3.8% variable APR",
          networkFee: "$0.05",
          risk: "Medium",
          status: "pending",
        },
      };
    default:
      return {
        reply:
          "I can help with swaps, lending, or borrowing — try something like \"swap 100 USDC for ETH\" or \"lend 200 USDC on Aave\".",
      };
  }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}