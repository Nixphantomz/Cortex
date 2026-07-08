import type { ActionCardData } from "./types";

interface AgentResponse {
  reply: string;
  card?: ActionCardData;
}

export async function generateAgentResponse(input: string): Promise<AgentResponse> {
  try {
    const res = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input }),
    });

    if (!res.ok) throw new Error(`Agent request failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(err);
    return {
      reply: "Cortex is having trouble reaching the model right now — check your connection and try again.",
    };
  }
}