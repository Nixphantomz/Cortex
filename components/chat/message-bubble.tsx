import clsx from "clsx";
import type { ChatMessage } from "@/lib/types";
import { ActionCard } from "./action-card";

export function MessageBubble({
  message,
  onSimulate,
  onExecute,
}: {
  message: ChatMessage;
  onSimulate: (id: string) => void;
  onExecute: (id: string) => void;
}) {
  const isUser = message.role === "user";

  return (
    <div className={clsx("flex flex-col gap-2", isUser ? "items-end" : "items-start")}>
      <div
        className={clsx(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-lavender/15 text-charcoal dark:text-milky"
            : "text-charcoal/80 dark:text-milky/80"
        )}
      >
        {message.content}
      </div>

      {message.card && (
        <ActionCard
          data={message.card}
          onSimulate={() => onSimulate(message.id)}
          onExecute={() => onExecute(message.id)}
        />
      )}
    </div>
  );
}