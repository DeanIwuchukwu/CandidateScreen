import type { LucideIcon } from "lucide-react";

export function ContactInfoRow({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3.5 items-center">
      <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[11px] bg-primary-tint text-primary">
        <Icon size={20} strokeWidth={1.7} />
      </span>
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-[13.5px] font-medium text-muted">{children}</div>
      </div>
    </div>
  );
}
