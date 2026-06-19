import { cn } from "@/lib/utils";

export function Eyebrow({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "text-xs font-semibold uppercase tracking-[0.12em] text-primary",
        className,
      )}
    >
      {children}
    </div>
  );
}
