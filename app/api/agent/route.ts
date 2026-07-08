import { NextResponse } from "next/server";
import { TOOLS, executeTool, type ToolName } from "@/lib/agent/tools";
import { SYSTEM_PROMPT } from "@/lib/agent/system-prompt";
import type { ActionCardData } from "@/lib/types";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

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

    const first = await callGroq(messages, true);
    const choice = first.choices[0].message;

    if (choice.tool_calls?.length) {
      const toolCall = choice.tool_calls[0];
      const args = JSON.parse(toolCall.function.arguments);

      let result;
      try {
        result = await executeTool(toolCall.function.name as ToolName, args);
      } catch (toolErr) {
        // These are expected, user-facing validation errors (unknown token,
        // same-token swap, bad amount) — surface the message directly rather
        // than falling through to the generic "network problem" fallback below.
        const message = toolErr instanceof Error ? toolErr.message : "I couldn't process that request.";
        return NextResponse.json({ reply: message });
      }

      const followUp = await callGroq(
        [
          ...messages,
          choice,
          {
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(result.data),
          },
        ],
        false
      );

      const finalText: string = followUp.choices[0].message.content ?? "Found a route for that.";
      const card: ActionCardData = result.card;
      return NextResponse.json({ reply: finalText, card });
    }

    return NextResponse.json({ reply: choice.content ?? "Could you say that a different way?" });
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