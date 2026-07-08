"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/types";
import type { OrbState } from "@/components/orb";
import { generateAgentResponse } from "@/lib/agent-client";
import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";

let idCounter = 0;
const nextId = () => `msg-${++idCounter}-${Date.now()}`;

export function ChatPanel({
  onOrbStateChange,
  onFirstMessage,
}: {
  onOrbStateChange: (state: OrbState) => void;
  onFirstMessage?: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text: string) => {
    if (messages.length === 0) onFirstMessage?.();
    const userMsg: ChatMessage = { id: nextId(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setBusy(true);
    onOrbStateChange("thinking");

    const { reply, card } = await generateAgentResponse(text);

    setMessages((prev) => [...prev, { id: nextId(), role: "assistant", content: reply, card }]);
    onOrbStateChange("idle");
    setBusy(false);
  };

  const updateCard = (id: string, patch: Partial<NonNullable<ChatMessage["card"]>>) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id && m.card ? { ...m, card: { ...m.card, ...patch } } : m))
    );
  };

  const handleSimulate = async (id: string) => {
    onOrbStateChange("thinking");
    updateCard(id, { status: "simulated" });
    await wait(500);
    onOrbStateChange("idle");
  };

  const handleExecute = async (id: string) => {
    onOrbStateChange("executing");
    updateCard(id, { status: "executing" });
    await wait(1000);
    updateCard(id, { status: "success" });
    onOrbStateChange("success");
    await wait(1400);
    onOrbStateChange("idle");
  };

  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      {messages.length > 0 && (
        <div ref={scrollRef} className="flex max-h-[50vh] flex-col gap-4 overflow-y-auto px-1 py-2">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} onSimulate={handleSimulate} onExecute={handleExecute} />
          ))}
        </div>
      )}
      <ChatInput onSend={handleSend} disabled={busy} />
    </div>
  );
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}