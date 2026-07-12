"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount, useSendTransaction, useSwitchChain } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import type { ChatMessage } from "@/lib/types";
import type { OrbState } from "@/components/orb";
import { generateAgentResponse } from "@/lib/agent-client";
import { ERC20_ABI } from "@/lib/erc20-abi";
import { xLayer } from "@/lib/chains";
import { xLayerPublicClient } from "@/lib/xlayer-client";
import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";

let idCounter = 0;
const nextId = () => `msg-${++idCounter}-${Date.now()}`;

interface PrepareApprovalResponse {
  isNative: boolean;
  approveTx: { to: string; data: string; spender: string; gasLimit: string; gasPrice: string } | null;
  tokenAddress: string;
  requiredAmountRaw: string;
  error?: string;
}

interface SwapTxResponse {
  swapTx: { to: string; data: string; value: string; gasLimit: string; gasPrice: string };
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

  const { address, isConnected, chainId } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const { switchChainAsync } = useSwitchChain();
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

    if (chainId !== xLayer.id) {
      try {
        updateCard(id, { status: "switching" });
        onOrbStateChange("thinking");
        await switchChainAsync({ chainId: xLayer.id });
      } catch (err) {
        updateCard(id, { status: "error", errorMessage: "Switch your wallet to X Layer mainnet to continue." });
        onOrbStateChange("error");
        await wait(1400);
        onOrbStateChange("idle");
        return;
      }
    }

    try {
      onOrbStateChange("thinking");
      const approvalRes = await fetch("/api/dex/prepare-approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromToken: card.fromToken, amount: card.amount }),
      });
      const approval: PrepareApprovalResponse = await approvalRes.json();
      if (!approvalRes.ok || approval.error) throw new Error(approval.error ?? "Failed to prepare approval.");

      // Step 1: approve, only if this is an ERC-20 and allowance is insufficient
      if (approval.approveTx) {
        const currentAllowance = await xLayerPublicClient.readContract({
          address: approval.tokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "allowance",
          args: [address, approval.approveTx.spender as `0x${string}`],
        });

        if (currentAllowance < BigInt(approval.requiredAmountRaw)) {
          updateCard(id, { status: "approving" });
          onOrbStateChange("thinking");
          const approveHash = await sendTransactionAsync({
            to: approval.approveTx.to as `0x${string}`,
            data: approval.approveTx.data as `0x${string}`,
            gas: BigInt(approval.approveTx.gasLimit),
            chainId: xLayer.id,
          });
          await xLayerPublicClient.waitForTransactionReceipt({ hash: approveHash });
        }
      }

      // Step 2: fetch the swap transaction FRESH, right before sending — never
      // reusing calldata fetched before the approval wait above, since real
      // time passing (wallet confirmation + block time) can make an
      // already-fetched quote stale enough to fail simulation/revert.
      updateCard(id, { status: "executing" });
      onOrbStateChange("executing");
      const swapRes = await fetch("/api/dex/swap-tx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromToken: card.fromToken,
          toToken: card.toToken,
          amount: card.amount,
          userWalletAddress: address,
        }),
      });
      const swapPrep: SwapTxResponse = await swapRes.json();
      if (!swapRes.ok || swapPrep.error) throw new Error(swapPrep.error ?? "Failed to fetch swap transaction.");

      const swapHash = await sendTransactionAsync({
        to: swapPrep.swapTx.to as `0x${string}`,
        data: swapPrep.swapTx.data as `0x${string}`,
        value: BigInt(swapPrep.swapTx.value || "0"),
        gas: BigInt(swapPrep.swapTx.gasLimit),
        chainId: xLayer.id,
      });

      const receipt = await xLayerPublicClient.waitForTransactionReceipt({ hash: swapHash });

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