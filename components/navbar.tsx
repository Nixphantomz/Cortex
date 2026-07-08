"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ThemeToggle } from "@/components/theme-toggle";

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-30 flex justify-center px-3 pt-4 sm:px-6">
      <nav className="glass flex w-full max-w-5xl items-center justify-between rounded-full px-3 py-2.5 sm:px-4">
        <div className="flex items-center gap-3 sm:gap-6">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            Cortex
          </Link>
          <Link
            href="/portfolio"
            className="text-xs font-medium text-charcoal/60 transition-colors hover:text-charcoal dark:text-milky/55 dark:hover:text-milky"
          >
            Portfolio
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          <ConnectButton.Custom>
            {({ account, chain, openConnectModal, openAccountModal, openChainModal, mounted }) => {
              const ready = mounted;
              const connected = ready && account && chain;

              if (!ready) {
                // Avoids a hydration mismatch flash before wagmi knows connection state
                return (
                  <div className="h-7 w-24 animate-pulse rounded-full bg-charcoal/10 dark:bg-milky/10 sm:w-28" />
                );
              }

              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    className="rounded-full bg-lavender/90 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-lavender sm:px-4"
                  >
                    Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    className="rounded-full bg-amber/90 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber sm:px-4"
                  >
                    Wrong network
                  </button>
                );
              }

              return (
                <button
                  onClick={openAccountModal}
                  className="flex items-center gap-1.5 rounded-full border border-charcoal/10 px-2.5 py-1.5 text-xs font-medium transition-colors hover:border-lavender/40 dark:border-milky/10 sm:gap-2 sm:px-3"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-mint" />
                  {account.displayName}
                </button>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </nav>
    </header>
  );
}