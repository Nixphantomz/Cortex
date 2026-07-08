import clsx from "clsx";
import { Check, Loader2 } from "lucide-react";
import type { ActionCardData, RiskLevel } from "@/lib/types";

const RISK_STYLES: Record<RiskLevel, string> = {
  Low: "text-mint-dim bg-mint/10",
  Medium: "text-amber bg-amber/10",
  High: "text-amber bg-amber/20",
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-charcoal/50 dark:text-milky/45">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function ActionCard({
  data,
  onSimulate,
  onExecute,
}: {
  data: ActionCardData;
  onSimulate: () => void;
  onExecute: () => void;
}) {
  const { protocol, summary, estimatedOutput, networkFee, risk, status } = data;

  return (
    <div className="glass w-full max-w-sm rounded-2xl p-4 animate-fade-up">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium">{summary}</p>
        <span className={clsx("rounded-full px-2 py-0.5 text-xs font-medium", RISK_STYLES[risk])}>
          {risk} risk
        </span>
      </div>

      <div className="space-y-1.5 border-t border-charcoal/5 pt-3 dark:border-milky/5">
        <Row label="Protocol" value={protocol} />
        <Row label="Estimated Output" value={estimatedOutput} />
        <Row label="Network Fee" value={networkFee} />
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={onSimulate}
          disabled={status === "executing" || status === "success"}
          className={clsx(
            "flex-1 rounded-full border px-4 py-2 text-xs font-medium transition-colors",
            "border-charcoal/10 hover:border-lavender/40 dark:border-milky/10",
            "disabled:cursor-not-allowed disabled:opacity-40"
          )}
        >
          {status === "simulated" ? "Simulated ✓" : "Simulate"}
        </button>

        <button
          onClick={onExecute}
          disabled={status === "executing" || status === "success"}
          className={clsx(
            "flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-colors",
            "bg-lavender/90 text-white hover:bg-lavender",
            "disabled:cursor-not-allowed disabled:opacity-60"
          )}
        >
          {status === "executing" && <Loader2 size={12} className="animate-spin" />}
          {status === "success" && <Check size={12} />}
          {status === "success" ? "Executed" : status === "executing" ? "Executing…" : "Execute"}
        </button>
      </div>
    </div>
  );
}