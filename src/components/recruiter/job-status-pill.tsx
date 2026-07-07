import { cn } from "@/lib/utils";
import type { JobStatus } from "@/lib/jobs/types";

const config: Record<
  JobStatus,
  { dot: string; text: string; bg: string; label: string; titleMuted?: boolean }
> = {
  OPEN: {
    dot: "bg-primary",
    text: "text-primary",
    bg: "bg-primary-tint",
    label: "Open",
  },
  DRAFT: {
    dot: "bg-[#E2A33C]",
    text: "text-warn",
    bg: "bg-warn-bg",
    label: "Draft",
    titleMuted: true,
  },
  CLOSED: {
    dot: "bg-[#C9CCC2]",
    text: "text-faint",
    bg: "bg-[#F1ECE0]",
    label: "Closed",
    titleMuted: true,
  },
};

export function JobStatusPill({ status }: { status: JobStatus }) {
  const c = config[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        c.text,
        c.bg,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
}

export function jobTitleMuted(status: JobStatus) {
  return config[status].titleMuted ?? false;
}
