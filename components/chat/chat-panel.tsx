"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount, useSendTransaction, usePublicClient } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import type { ChatMessage } from "@/lib/types";
import type { OrbState } from "@/components/orb";
import { generateAgentResponse } from "@/lib/agent-client";
import { ERC20_ABI } from "@/lib/erc20-abi";
import { xLayer } from "@/lib/chains";
import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";

let idCounter = 0;
const nextId = () => `msg-${++idCounter}-${Date.now()}`;

interface PrepareSwapResponse {
  isNative: boolean;
  approveTx: { to: string; data: string; spender: string; gasLimit: string; gasPrice: string } | null;
  swapTx: { to: string; data: string; value: string; gasLimit: string; gasPrice: string };
  tokenAddress: string;
  requiredAmountRaw: string;
  error?: string;
}

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

  const { address, isConnected } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const publicClient = usePublicClient({ chainId: xLayer.id });
  const { openConnectModal } = useConnectModal();

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
    const message = messages.find((m) => m.id === id);
    const card = message?.card;
    if (!card) return;

    // Lending/borrowing stay simulated — see lib/agent/tools.ts for why.
    if (card.kind !== "swap") {
      onOrbStateChange("executing");
      updateCard(id, { status: "executing" });
      await wait(1000);
      updateCard(id, { status: "success" });
      onOrbStateChange("success");
      await wait(1400);
      onOrbStateChange("idle");
      return;
    }

    // Real execution from here down — this moves real funds on X Layer mainnet.
    if (!isConnected || !address) {
      updateCard(id, { status: "error", errorMessage: "Connect your wallet first." });
      return;
    }
    if (!publicClient) {
      updateCard(id, { status: "error", errorMessage: "Wallet isn't on X Layer mainnet." });
      return;
    }

    try {
      onOrbStateChange("thinking");
      const res = await fetch("/api/dex/prepare-swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromToken: card.fromToken,
          toToken: card.toToken,
          amount: card.amount,
          userWalletAddress: address,
        }),
      });
      const prep: PrepareSwapResponse = await res.json();
      if (!res.ok || prep.error) throw new Error(prep.error ?? "Failed to prepare the swap.");

      // Step 1: approve, only if this is an ERC-20 and allowance is insufficient
      if (prep.approveTx) {
        const currentAllowance = await publicClient.readContract({
          address: prep.tokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "allowance",
          args: [address, prep.approveTx.spender as `0x${string}`],
        });

        if (currentAllowance < BigInt(prep.requiredAmountRaw)) {
          updateCard(id, { status: "approving" });
          onOrbStateChange("thinking");
          const approveHash = await sendTransactionAsync({
            to: prep.approveTx.to as `0x${string}`,
            data: prep.approveTx.data as `0x${string}`,
            gas: BigInt(prep.approveTx.gasLimit),
            chainId: xLayer.id,
          });
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
        }
      }

      // Step 2: the actual swap
      updateCard(id, { status: "executing" });
      onOrbStateChange("executing");
      const swapHash = await sendTransactionAsync({
        to: prep.swapTx.to as `0x${string}`,
        data: prep.swapTx.data as `0x${string}`,
        value: BigInt(prep.swapTx.value || "0"),
        gas: BigInt(prep.swapTx.gasLimit),
        chainId: xLayer.id,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash: swapHash });

      if (receipt.status === "success") {
        updateCard(id, { status: "success", txHash: swapHash });
        onOrbStateChange("success");
      } else {
        updateCard(id, { status: "error", errorMessage: "Transaction reverted on-chain." });
        onOrbStateChange("error");
      }
    } catch (err) {
      console.error("Swap execution failed:", err);
      const message = err instanceof Error ? err.message : "Swap failed.";
      // Wallet rejections shouldn't look like a system error
      const friendly = message.toLowerCase().includes("rejected") ? "Transaction rejected in wallet." : message;
      updateCard(id, { status: "error", errorMessage: friendly });
      onOrbStateChange("error");
    } finally {
      await wait(1400);
      onOrbStateChange("idle");
    }
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

      {isConnected ? (
        <ChatInput onSend={handleSend} disabled={busy} />
      ) : (
        <button
          onClick={openConnectModal}
          className="glass rounded-2xl px-4 py-3 text-center text-sm font-medium text-charcoal/60 transition-colors hover:text-lavender-dim dark:text-milky/55 dark:hover:text-lavender-soft"
        >
          Connect your wallet to start chatting with Cortex
        </button>
      )}
    </div>
  );
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}