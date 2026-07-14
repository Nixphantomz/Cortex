import { NextResponse } from "next/server";
import { TOOLS, executeTool, type ToolName } from "@/lib/agent/tools";
import { SYSTEM_PROMPT } from "@/lib/agent/system-prompt";
import type { ActionCardData } from "@/lib/types";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

// Caps how many tool-call rounds a single request can take. Two steps
// covers the main use case (swap-quote → lending/borrow-rate); this
// leaves headroom without allowing a runaway loop.
const MAX_STEPS = 4;

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({
        reply:
          "Cortex isn't connected to a model yet — add GROQ_API_KEY to .env.local (get a free key at console.groq.com).",
      });
    }

    const messages: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: message },
    ];

    let lastCard: ActionCardData | undefined;

    for (let step = 0; step < MAX_STEPS; step++) {
      const response = await callGroq(messages, true);
      const choice = response.choices[0].message;
      messages.push(choice);

      if (!choice.tool_calls?.length) {
        // Model gave a final answer — no more tool calls needed.
        return NextResponse.json({ reply: choice.content ?? "Could you say that a different way?", card: lastCard });
      }

      // Execute every tool call in this round (usually one, but the API
      // allows several), feeding results back so the model can chain steps
      // (e.g. converting a cross-currency amount before quoting a lend rate).
      for (const toolCall of choice.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments);
        let toolResultContent: string;

        try {
          const result = await executeTool(toolCall.function.name as ToolName, args);
          lastCard = result.card;
          toolResultContent = JSON.stringify(result.data);
        } catch (toolErr) {
          // Feed the error back to the model as a tool result rather than
          // short-circuiting — lets it explain the problem naturally, or
          // recover (e.g. ask a clarifying question), instead of us
          // hard-coding one canned response for every failure.
          const errMessage = toolErr instanceof Error ? toolErr.message : "Tool execution failed.";
          toolResultContent = JSON.stringify({ error: errMessage });
        }

        messages.push({ role: "tool", tool_call_id: toolCall.id, content: toolResultContent });
      }
    }

    // Hit the step cap without a final answer — rare, but fail honestly.
    return NextResponse.json({
      reply: "That request needs more steps than I can take right now — try breaking it into smaller parts.",
      card: lastCard,
    });
  } catch (err) {
    console.error("Agent route error:", err);
    return NextResponse.json(
      { reply: "Cortex hit an error reaching the model. Check your GROQ_API_KEY and try again." },
      { status: 200 }
    );
  }
}

async function callGroq(messages: any[], withTools: boolean) {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      ...(withTools ? { tools: TOOLS, tool_choice: "auto" } : {}),
      temperature: 0.4,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq API error ${res.status}: ${text}`);
  }

  return res.json();
}