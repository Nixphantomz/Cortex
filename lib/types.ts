export type ChatRole = "user" | "assistant";

export type RiskLevel = "Low" | "Medium" | "High";

export type ActionKind = "swap" | "lend" | "borrow" | "unknown";

export type ActionStatus = "pending" | "simulated" | "approving" | "executing" | "success" | "error";

export interface ActionCardData {
  kind: ActionKind;
  protocol: string;
  summary: string; // e.g. "100 USDC → ETH"
  estimatedOutput: string;
  networkFee: string;
  risk: RiskLevel;
  status: ActionStatus;
  // Structured fields for "swap" cards only — needed to actually execute,
  // since `summary` is just display text.
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