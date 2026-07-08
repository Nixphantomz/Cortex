"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

export type OrbState = "idle" | "thinking" | "executing" | "success" | "error";

interface OrbProps {
  state?: OrbState;
  size?: number;
  className?: string;
}

// Each state gets its own core gradient (the sphere) and halo gradient
// (the soft diffuse bloom behind it, like the reference mockups).
const STATE_GRADIENTS: Record<OrbState, { core: string; halo: string; particle: string }> = {
  idle: {
    core: "radial-gradient(circle at 32% 28%, #E5E7EB 0%, #C4B5FD 30%, #A78BFA 55%, #6D6AA8 85%)",
    halo: "radial-gradient(circle, rgba(167,139,250,0.45) 0%, rgba(126,231,193,0.15) 55%, transparent 75%)",
    particle: "#A78BFA",
  },
  thinking: {
    core: "radial-gradient(circle at 32% 28%, #F1EEFF 0%, #C4B5FD 25%, #A78BFA 50%, #6C5DBF 85%)",
    halo: "radial-gradient(circle, rgba(167,139,250,0.6) 0%, rgba(139,124,216,0.2) 55%, transparent 75%)",
    particle: "#C4B5FD",
  },
  executing: {
    core: "radial-gradient(circle at 32% 28%, #EAFBF4 0%, #A7F0D5 25%, #7EE7C1 50%, #4FAF8C 85%)",
    halo: "radial-gradient(circle, rgba(126,231,193,0.55) 0%, rgba(167,139,250,0.2) 55%, transparent 75%)",
    particle: "#7EE7C1",
  },
  success: {
    core: "radial-gradient(circle at 32% 28%, #FFFFFF 0%, #A7F0D5 25%, #7EE7C1 55%, #3F9C7C 90%)",
    halo: "radial-gradient(circle, rgba(126,231,193,0.7) 0%, transparent 70%)",
    particle: "#7EE7C1",
  },
  error: {
    core: "radial-gradient(circle at 32% 28%, #FDF2E3 0%, #F2B880 30%, #D89A5F 60%, #A96F3C 90%)",
    halo: "radial-gradient(circle, rgba(242,184,128,0.5) 0%, transparent 70%)",
    particle: "#F2B880",
  },
};

/**
 * The Orb is Cortex's face. It never shows a status label — its color,
 * shape, and motion ARE the status. The blob-morph gives it the organic,
 * "alive" quality from the reference mockups; breathing scale and halo
 * bloom add depth on top. Keep all transitions slow (5.5–9s) so it reads
 * as calm intelligence, never a loading spinner.
 */
export function Orb({ state = "idle", size = 180, className }: OrbProps) {
  const gradient = STATE_GRADIENTS[state];
  const hasParticles = state === "thinking" || state === "executing";
  const particles = useMemo(() => [0, 1, 2], []);

  return (
    <div
      className={clsx("relative flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Cortex assistant — ${state}`}
    >
      {/* Diffuse halo — soft, blurred, larger than the sphere itself */}
      <div
        className="absolute animate-blob-slow blur-2xl transition-[background] duration-700 ease-out"
        style={{
          width: size * 1.4,
          height: size * 1.4,
          background: gradient.halo,
        }}
      />

      {/* Orbiting particles (thinking / executing only) */}
      <AnimatePresence>
        {hasParticles &&
          particles.map((i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.9 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute rounded-full animate-orbit-particle"
              style={{
                width: 5,
                height: 5,
                backgroundColor: gradient.particle,
                animationDelay: `${i * 1.05}s`,
              }}
            />
          ))}
      </AnimatePresence>

      {/* Success ripple */}
      {state === "success" && (
        <span
          className="absolute rounded-full border border-mint/60 animate-ripple"
          style={{ width: size * 0.7, height: size * 0.7 }}
        />
      )}

      {/* Core sphere — organic blob morph + gentle breathing scale */}
      <motion.div
        animate={{ scale: state === "idle" ? [1, 1.035, 1] : 1 }}
        transition={{ duration: 5.5, repeat: state === "idle" ? Infinity : 0, ease: "easeInOut" }}
        className="animate-blob shadow-2xl transition-[background] duration-700 ease-out"
        style={{
          width: size * 0.62,
          height: size * 0.62,
          background: gradient.core,
        }}
      />
    </div>
  );
}