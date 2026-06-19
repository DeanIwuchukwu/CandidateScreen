import Link from "next/link";
import { cn } from "@/lib/utils";

export function Wordmark({
  className,
  href = "/",
  light = false,
}: {
  className?: string;
  href?: string;
  light?: boolean;
}) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "h-2.5 w-2.5 rounded-full",
          light ? "bg-[#7FB79A]" : "bg-primary",
        )}
      />
      <span
        className={cn(
          "text-base font-semibold tracking-tight",
          light ? "text-white" : "text-ink",
        )}
      >
        Candidate Screen
      </span>
    </Link>
  );
}
