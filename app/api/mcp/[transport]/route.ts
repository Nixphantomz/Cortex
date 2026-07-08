import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { executeTool } from "@/lib/agent/tools";
import { getPortfolio } from "@/lib/agent/portfolio";

/**
 * This is Cortex's A2MCP endpoint — the callable service other agents
 * discover and pay per-call through OKX.AI's marketplace, per OKX's
 * Onchain OS registration flow. It intentionally wraps the SAME functions
 * the chat UI uses (lib/agent/tools.ts, lib/agent/portfolio.ts), so the
 * two surfaces never drift out of sync.
 *
 * swap_quote calls OKX's real DEX aggregator (lib/okx-dex.ts) — live prices,
 * live routes. lending_rate and borrow_rate still return simulated data;
 * no verified lending protocol on X Layer was found to integrate honestly.
 */
const handler = createMcpHandler(
  (server) => {
    server.tool(
      "swap_quote",
      "Get a swap route and quote for exchanging one token for another on X Layer (mainnet, chainId 196). Supported tokens: USDC, USDT, DAI, ETH, WETH, WBTC, OKB.",
      {
        fromToken: z.string().describe("Token symbol being sold, e.g. USDC"),
        toToken: z.string().describe("Token symbol being bought, e.g. ETH"),
        amount: z.number().positive().describe("Amount of fromToken to swap"),
      },
      async ({ fromToken, toToken, amount }) => {
        try {
          const result = await executeTool("get_swap_quote", { fromToken, toToken, amount });
          return { content: [{ type: "text", text: JSON.stringify(result.data) }] };
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to get swap quote.";
          return { content: [{ type: "text", text: message }], isError: true };
        }
      }
    );

    server.tool(
      "lending_rate",
      "Get the best lending/supply rate for depositing a token into a money market. Currently simulated data, not a live protocol integration.",
      {
        token: z.string().describe("Token symbol to supply, e.g. USDC"),
        amount: z.number().positive().describe("Amount to supply"),
      },
      async ({ token, amount }) => {
        try {
          const result = await executeTool("get_lending_rate", { token, amount });
          return { content: [{ type: "text", text: JSON.stringify(result.data) }] };
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to get lending rate.";
          return { content: [{ type: "text", text: message }], isError: true };
        }
      }
    );

    server.tool(
      "borrow_rate",
      "Get the best borrow rate for borrowing a token against existing collateral. Currently simulated data, not a live protocol integration.",
      {
        token: z.string().describe("Token symbol to borrow, e.g. USDC"),
        amount: z.number().positive().describe("Amount to borrow"),
      },
      async ({ token, amount }) => {
        try {
          const result = await executeTool("get_borrow_rate", { token, amount });
          return { content: [{ type: "text", text: JSON.stringify(result.data) }] };
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to get borrow rate.";
          return { content: [{ type: "text", text: message }], isError: true };
        }
      }
    );

    server.tool(
      "portfolio",
      "Get real net worth, holdings, and idle-asset suggestions for a wallet on X Layer mainnet, read live from on-chain balances.",
      {
        walletAddress: z.string().describe("EVM wallet address to analyze, e.g. 0x1234..."),
      },
      async ({ walletAddress }) => {
        try {
          const result = await getPortfolio(walletAddress);
          return { content: [{ type: "text", text: JSON.stringify(result) }] };
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to load portfolio.";
          return { content: [{ type: "text", text: message }], isError: true };
        }
      }
    );
  },
  {},
  { basePath: "/api/mcp" }
);

export { handler as GET, handler as POST, handler as DELETE };