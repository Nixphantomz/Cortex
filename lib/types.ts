export type ChatRole = "user" | "assistant";

export type RiskLevel = "Low" | "Medium" | "High";

export type ActionKind = "swap" | "lend" | "borrow" | "unknown";

export type ActionStatus = "pending" | "simulated" | "switching" | "approving" | "executing" | "success" | "error";

export interface ActionCardData {
  kind: ActionKind;
  protocol: string;
  summary: string; // e.g. "100 USDC → ETH"
  estimatedOutput: string;
  networkFee: string;
  risk: RiskLevel;
  status: ActionStatus;
  // Structured fields needed to actually execute — `summary` is just
  // display text. For swap: fromToken/toToken/amount all set. For real
  // (non-simulated) lend/borrow: fromToken (the asset) + amount set.
  fromToken?: string;
  toToken?: string;
  amount?: number;
  txHash?: string;
  errorMessage?: string;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  card?: ActionCardData;
}