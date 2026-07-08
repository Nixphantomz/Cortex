export type ChatRole = "user" | "assistant";

export type RiskLevel = "Low" | "Medium" | "High";

export type ActionKind = "swap" | "lend" | "borrow" | "unknown";

export type ActionStatus = "pending" | "simulated" | "executing" | "success" | "error";

export interface ActionCardData {
  kind: ActionKind;
  protocol: string;
  summary: string; // e.g. "100 USDC → ETH"
  estimatedOutput: string;
  networkFee: string;
  risk: RiskLevel;
  status: ActionStatus;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  card?: ActionCardData;
}