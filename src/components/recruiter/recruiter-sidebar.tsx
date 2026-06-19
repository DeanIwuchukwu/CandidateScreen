"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  LayoutGrid,
  ListVideo,
  Settings,
  Users,
} from "lucide-react";
import { Wordmark } from "@/components/ui/wordmark";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/app", label: "Dashboard", icon: LayoutGrid, exact: true },
  { href: "/app/interviews", label: "Interviews", icon: ListVideo },
  { href: "/app/candidates", label: "Candidates", icon: Users },
  { href: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export function RecruiterSidebar({
  userName,
  workspaceName,
}: {
  userName: string;
  workspaceName: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex w-[232px] shrink-0 flex-col border-r border-hairline bg-paper-2 p-5">
      <Wordmark href="/app" className="px-2 pb-5" />
      <nav className="flex flex-col gap-0.5">
        {nav.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-sm font-semibold transition-colors",
                active
                  ? "bg-primary-tint-2 text-primary"
                  : "text-muted hover:bg-paper hover:text-ink",
              )}
            >
              <Icon size={18} strokeWidth={1.7} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex items-center gap-2.5 border-t border-hairline px-2 pt-4">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-xs font-semibold text-white">
          {userName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </span>
        <div className="leading-tight">
          <div className="text-[13px] font-semibold">{userName}</div>
          <div className="text-xs font-medium text-faint">{workspaceName}</div>
        </div>
      </div>
    </aside>
  );
}
