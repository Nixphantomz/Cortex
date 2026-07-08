"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="glass flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:border-lavender/40"
    >
      {theme === "dark" ? (
        <Sun size={16} strokeWidth={1.75} className="text-silver" />
      ) : (
        <Moon size={16} strokeWidth={1.75} className="text-charcoal/70" />
      )}
    </button>
  );
}
