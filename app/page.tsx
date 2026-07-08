"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Orb, type OrbState } from "@/components/orb";
import { ChatPanel } from "@/components/chat/chat-panel";

export default function Home() {
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [started, setStarted] = useState(false);

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden px-6 pb-12">
      {/* Ambient background texture — extremely subtle, never competes with the orb */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.15] dark:opacity-[0.25]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 20%, rgba(167,139,250,0.25), transparent 45%), radial-gradient(circle at 75% 75%, rgba(126,231,193,0.2), transparent 45%)",
        }}
      />

      <div
        className={
          started
            ? "relative z-10 flex w-full flex-col items-center pt-28"
            : "relative z-10 flex min-h-screen w-full flex-col items-center justify-center px-1 pt-28 text-center"
        }
      >
        {!started && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.3em] text-charcoal/50 dark:text-milky/40">
              Cortex
            </p>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              Your AI DeFi Operator
            </h1>
            <p className="mx-auto mt-4 max-w-md text-balance text-base text-charcoal/60 dark:text-milky/55">
              Manage swaps, lending, borrowing and portfolio operations
              through natural language.
            </p>
          </motion.div>
        )}

        <motion.div
          layout
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className={started ? "mb-6" : "mt-16"}
        >
          <Orb state={orbState} size={started ? 100 : 200} />
        </motion.div>

        <ChatPanel onOrbStateChange={setOrbState} onFirstMessage={() => setStarted(true)} />
      </div>
    </main>
  );
}