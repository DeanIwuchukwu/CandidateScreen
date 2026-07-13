import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({
  light = false,
  size = 28,
  className,
}: {
  light?: boolean;
  size?: number;
  className?: string;
}) {
  const markSrc = light
    ? "/brand/candidatescreen-mark-reverse.svg"
    : "/brand/candidatescreen-mark.svg";

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={markSrc}
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      style={{ width: size, height: size }}
    />
  );
}

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
      <LogoMark light={light} size={28} />
      <span className="font-display text-[17px] font-medium leading-none tracking-tight">
        <span className={light ? "text-white" : "text-ink"}>Talang </span>
        <span className={light ? "text-[#7FB79A]" : "text-primary"}>Flow</span>
      </span>
    </Link>
  );
}
