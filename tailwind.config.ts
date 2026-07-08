import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark mode surfaces
        charcoal: {
          DEFAULT: "#0F1115",
          card: "#171A20",
          border: "#23262E",
        },
        // Light mode surfaces
        milky: {
          DEFAULT: "#F8F8F6",
          card: "#F1F2F4",
          border: "#E4E4E0",
        },
        // Accents
        lavender: {
          DEFAULT: "#A78BFA",
          soft: "#C4B5FD",
          dim: "#8B7CD8",
        },
        mint: {
          DEFAULT: "#7EE7C1",
          soft: "#A7F0D5",
          dim: "#5FCBA3",
        },
        silver: {
          DEFAULT: "#D1D5DB",
          soft: "#E5E7EB",
        },
        amber: {
          DEFAULT: "#F2B880",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      keyframes: {
        breathe: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.9" },
          "50%": { transform: "scale(1.04)", opacity: "1" },
        },
        "orbit-particle": {
          "0%": { transform: "rotate(0deg) translateX(38px) rotate(0deg)" },
          "100%": { transform: "rotate(360deg) translateX(38px) rotate(-360deg)" },
        },
        ripple: {
          "0%": { transform: "scale(0.8)", opacity: "0.6" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        blob: {
          "0%, 100%": { borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" },
          "25%": { borderRadius: "30% 60% 70% 40% / 50% 60% 30% 60%" },
          "50%": { borderRadius: "50% 60% 30% 60% / 40% 50% 60% 50%" },
          "75%": { borderRadius: "60% 40% 60% 30% / 70% 30% 50% 60%" },
        },
      },
      animation: {
        breathe: "breathe 5.5s ease-in-out infinite",
        "orbit-particle": "orbit-particle 3.2s linear infinite",
        ripple: "ripple 1.1s ease-out forwards",
        "fade-up": "fade-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        blob: "blob 9s ease-in-out infinite",
        "blob-slow": "blob 13s ease-in-out infinite reverse",
      },
    },
  },
  plugins: [],
};

export default config;