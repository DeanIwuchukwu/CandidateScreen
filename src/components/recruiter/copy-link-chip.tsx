"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function CopyLinkChip({
  url,
  label,
  className,
}: {
  url: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div
      className={cn(
        "flex max-w-[300px] items-center gap-2 rounded-[9px] border border-[#E4DDCD] bg-paper-2 px-3 py-2",
        className,
      )}
    >
      <Link2 size={14} className="shrink-0 text-primary" strokeWidth={1.8} />
      <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-muted">
        {label ?? url.replace(/^https?:\/\//, "")}
      </span>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 text-[12px] font-semibold text-primary hover:underline"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
