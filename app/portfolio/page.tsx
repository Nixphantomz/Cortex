"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

interface Holding {
  symbol: string;
  balance: number;
  usdValue: number;
}

interface PortfolioResult {
  netWorth: number;
  holdings: Holding[];
  idleAssetsUsd: number;
  idleYieldPotentialPerDay: number;
  healthScore: number;
  suggestions: string[];
}

export default function PortfolioPage() {
  const { address, isConnected } = useAccount();
  const [data, setData] = useState<PortfolioResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected || !address) return;
    setLoading(true);
    setError(null);

    fetch("/api/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress: address }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setData(json);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [address, isConnected]);

  if (!isConnected) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <p className="text-charcoal/60 dark:text-milky/55">
          Connect your wallet to view your X Layer portfolio.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 pb-16 pt-28">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Portfolio</h1>
      <p className="mb-6 text-sm text-charcoal/50 dark:text-milky/45">X Layer mainnet</p>

      {loading && (
        <p className="text-sm text-charcoal/50 dark:text-milky/45">Reading on-chain balances…</p>
      )}
      {error && <p className="text-sm text-amber">{error}</p>}

      {data && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <StatCard label="Net Worth" value={`$${data.netWorth.toFixed(2)}`} />
            <StatCard label="Health Score" value={`${data.healthScore}/10`} sub="heuristic estimate" />
            <StatCard label="Idle Assets" value={`$${data.idleAssetsUsd.toFixed(2)}`} />
            <StatCard
              label="Idle Yield Potential"
              value={`+$${data.idleYieldPotentialPerDay.toFixed(3)}/day`}
              sub="if deployed — estimated"
            />
          </div>

          <div className="glass rounded-2xl p-4">
            <p className="mb-3 text-sm font-medium">Holdings</p>
            <div className="space-y-2">
              {data.holdings.length === 0 && (
                <p className="text-sm text-charcoal/50 dark:text-milky/45">
                  No funds detected on X Layer mainnet.
                </p>
              )}
              {data.holdings.map((h) => (
                <div key={h.symbol} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{h.symbol}</span>
                  <span className="text-charcoal/60 dark:text-milky/55">
                    {h.balance.toFixed(4)} · ${h.usdValue.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {data.suggestions.length > 0 && (
            <div className="glass rounded-2xl p-4">
              <p className="mb-3 text-sm font-medium">Suggestions</p>
              <ul className="space-y-1.5 text-sm text-charcoal/70 dark:text-milky/65">
                {data.suggestions.map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-xs text-charcoal/50 dark:text-milky/45">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-charcoal/35 dark:text-milky/30">{sub}</p>}
    </div>
  );
}