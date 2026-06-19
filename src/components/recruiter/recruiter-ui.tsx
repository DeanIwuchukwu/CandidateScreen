import Link from "next/link";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchField({
  placeholder,
  className,
}: {
  placeholder: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex max-w-[280px] flex-1 items-center gap-2 rounded-[9px] border border-[#E4DDCD] px-3 py-2 text-faint-2",
        className,
      )}
    >
      <Search size={15} strokeWidth={1.8} />
      <span className="text-[13px] font-medium">{placeholder}</span>
    </div>
  );
}

export function SortLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-auto text-[12.5px] font-semibold text-faint">{children}</span>
  );
}

type Tab = { label: string; href: string; count?: number; active?: boolean };

export function CountTabs({ tabs }: { tabs: Tab[] }) {
  return (
    <div className="flex gap-6 border-b border-hairline-3">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            "pb-3 text-sm font-semibold",
            tab.active
              ? "border-b-2 border-primary text-primary"
              : "text-faint",
          )}
        >
          {tab.label}{" "}
          {tab.count !== undefined && (
            <span className={tab.active ? "text-[#9CB6A6]" : "text-[#C9CCC2]"}>
              {tab.count}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}

export function TableHeader({
  columns,
}: {
  columns: string[];
}) {
  return (
    <div
      className="grid gap-4 border-b border-hairline bg-paper-2 px-[22px] py-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-faint-2"
      style={{
        gridTemplateColumns:
          columns.length === 5
            ? "2.6fr 1fr 1.4fr 1.2fr 0.5fr"
            : "2.4fr 1.1fr 1.3fr 1.2fr 0.6fr",
      }}
    >
      {columns.map((col) => (
        <span key={col}>{col}</span>
      ))}
    </div>
  );
}

export function InterviewStatusDot({
  status,
}: {
  status: "ACTIVE" | "DRAFT" | "CLOSED";
}) {
  const config = {
    ACTIVE: { dot: "bg-primary", text: "text-primary", label: "Active" },
    DRAFT: { dot: "bg-[#E2A33C]", text: "text-warn", label: "Draft" },
    CLOSED: { dot: "bg-[#C9CCC2]", text: "text-faint", label: "Closed" },
  }[status];

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[11.5px] font-semibold", config.text)}>
      <span className={cn("h-[7px] w-[7px] rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}

export function ResponseProgress({
  responded,
  invited,
  closed = false,
}: {
  responded: number;
  invited: number;
  closed?: boolean;
}) {
  const pct = invited > 0 ? Math.round((responded / invited) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 max-w-[90px] flex-1 overflow-hidden rounded-[3px] bg-[#EEE8DB]">
        <div
          className={cn("h-full rounded-[3px]", closed ? "bg-[#9CB6A6]" : "bg-primary")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[12.5px] font-semibold text-muted">
        {responded}/{invited}
      </span>
    </div>
  );
}

export function OwnerCell({
  name,
  initials,
  color = "#1C6B47",
}: {
  name: string;
  initials: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="grid h-7 w-7 place-items-center rounded-full text-[11px] font-semibold text-white"
        style={{ backgroundColor: color }}
      >
        {initials}
      </span>
      <span className="text-[12.5px] font-medium text-muted">{name}</span>
    </div>
  );
}

export function AvatarCircle({
  initials,
  color = "#1C6B47",
  size = "md",
}: {
  initials: string;
  color?: string;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-7 w-7 text-[11px]" : "h-[38px] w-[38px] text-[13px]";
  return (
    <span
      className={cn("grid shrink-0 place-items-center rounded-full font-semibold text-white", dim)}
      style={{ backgroundColor: color }}
    >
      {initials}
    </span>
  );
}

export function VideoThumb({ variant = 0 }: { variant?: number }) {
  const gradients = [
    "from-[#6E7C6F] to-[#3A433B]",
    "from-[#7A766C] to-[#403A33]",
    "from-[#6B7775] to-[#36403F]",
    "from-[#76746E] to-[#3D3A34]",
  ];
  return (
    <div
      className={cn(
        "relative h-12 w-[72px] shrink-0 overflow-hidden rounded-lg bg-gradient-to-br",
        gradients[variant % gradients.length],
      )}
    >
      <div className="absolute bottom-[-12%] left-1/2 h-[64%] w-[60%] -translate-x-1/2 bg-[radial-gradient(70%_90%_at_50%_22%,#2A352E_60%,transparent_80%)]" />
      <div className="absolute bottom-[34%] left-1/2 aspect-square w-[30%] -translate-x-1/2 rounded-full bg-[radial-gradient(64%_64%_at_42%_34%,#37433A_55%,transparent_78%)]" />
    </div>
  );
}

export function StatusPill({
  children,
  tone = "new",
}: {
  children: React.ReactNode;
  tone?: "new" | "started" | "reviewed" | "progress" | "muted";
}) {
  const tones = {
    new: "bg-primary-tint text-primary",
    started: "bg-warn-bg text-warn",
    reviewed: "bg-hairline-2 text-muted",
    progress: "bg-warn-bg text-warn",
    muted: "bg-hairline-2 text-muted",
  };
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", tones[tone])}>
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  breadcrumb,
  actions,
}: {
  title: string;
  subtitle?: string;
  breadcrumb?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="px-8 pt-[22px]">
      {breadcrumb}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[28px] font-medium leading-none">{title}</h1>
          {subtitle && (
            <p className="mt-1.5 text-[13px] font-medium text-faint">{subtitle}</p>
          )}
        </div>
        {actions}
      </div>
    </div>
  );
}

export function Breadcrumb({
  items,
}: {
  items: Array<{ label: string; href?: string; active?: boolean }>;
}) {
  return (
    <div className="mb-2 flex items-center gap-2.5 text-[13px] font-medium text-faint">
      {items.map((item, i) => (
        <span key={item.label} className="flex items-center gap-2.5">
          {i > 0 && <span className="text-[#C9CCC2]">/</span>}
          {item.href && !item.active ? (
            <Link href={item.href} className="hover:text-ink">
              {item.label}
            </Link>
          ) : (
            <span className={item.active ? "font-semibold text-ink" : undefined}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

export function FilterButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="rounded-[9px] border border-[#E4DDCD] bg-white px-[13px] py-2 text-[12.5px] font-semibold text-muted"
    >
      {children}
    </button>
  );
}

const settingsTabs = [
  { label: "Workspace", href: "/app/settings", key: "workspace" },
  { label: "Team", href: "/app/settings", key: "team" },
  { label: "Branding", href: "/app/settings", key: "branding" },
  { label: "Notifications", href: "/app/settings", key: "notifications" },
  { label: "Billing", href: "/app/settings/billing", key: "billing" },
] as const;

export function SettingsTabs({
  active,
}: {
  active: (typeof settingsTabs)[number]["key"];
}) {
  return (
    <div className="mt-[18px] flex gap-6 border-b border-hairline-3">
      {settingsTabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={cn(
            "pb-3 text-sm font-semibold",
            active === tab.key
              ? "border-b-2 border-primary text-primary"
              : "text-faint",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-faint-2">
      {children}
    </div>
  );
}

export function ToggleSwitch({ on = false }: { on?: boolean }) {
  return (
    <span
      className={cn(
        "relative h-[23px] w-10 shrink-0 rounded-full",
        on ? "bg-primary" : "bg-[#DCD5C4]",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-[19px] w-[19px] rounded-full bg-white",
          on ? "right-0.5" : "left-0.5",
        )}
      />
    </span>
  );
}
