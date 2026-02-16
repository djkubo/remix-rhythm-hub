import { CheckCheck } from "lucide-react";

import { cn } from "@/lib/utils";

export type WhatsAppProofMessage = {
  id: string;
  text: string;
  time?: string;
};

type WhatsAppProofProps = {
  messages: WhatsAppProofMessage[];
  className?: string;
};

export default function WhatsAppProof({ messages, className }: WhatsAppProofProps) {
  return (
    <div
      className={cn(
        "relative mx-auto max-w-md space-y-4 rounded-2xl border border-[#5E5E5E] bg-[#0B141A] p-4 shadow-2xl sm:p-6",
        className
      )}
    >
      {messages.map((msg) => (
        <div
          key={msg.id}
          className="relative w-fit max-w-[85%] rounded-lg rounded-tl-none border border-[#2A3942] bg-[#202C33] p-3 text-[#E9EDEF] shadow-sm"
        >
          <span
            aria-hidden
            className="absolute -left-[6px] top-0 h-3 w-3 rotate-45 border-l border-t border-[#2A3942] bg-[#202C33]"
          />

          <p className="text-sm leading-relaxed">{msg.text}</p>

          <div className="mt-1 text-right text-[10px] text-muted-foreground">
            {msg.time || "14:23"}{" "}
            <CheckCheck className="ml-1 inline-block h-3 w-3 text-[#53BDEB]" />
          </div>
        </div>
      ))}
    </div>
  );
}

