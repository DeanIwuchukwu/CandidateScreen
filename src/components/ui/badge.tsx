import { cn } from "@/lib/utils";

export function Badge({
  className,
  children,
  tone = "default",
}: {
  className?: string;
  children: React.ReactNode;
  tone?: "default" | "primary" | "warn" | "muted";
}) {
  const tones = {
    default: "bg-paper-2 text-ink-2 border-hairline",
    primary: "bg-primary-tint text-primary border-transparent",
    warn: "bg-warn-bg text-warn border-transparent",
    muted: "bg-paper-2 text-faint border-hairline",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
