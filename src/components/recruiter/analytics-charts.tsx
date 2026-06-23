"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SectionLabel } from "@/components/recruiter/recruiter-ui";

const FUNNEL_COLORS = ["#1C6B47", "#2C8159", "#3C9568", "#6BA98A", "#9CC4AF"];

export function AnalyticsCharts({
  funnel,
  completionTrend,
  dropOff,
  roleStats,
}: {
  funnel: Array<{ label: string; count: number; pct: number }>;
  completionTrend: Array<{ week: string; rate: number }>;
  dropOff: Array<{ question: string; rate: number }>;
  roleStats: Array<{ title: string; invited: number; completion: number; avgScore: number }>;
}) {
  return (
    <>
      <div className="grid gap-[18px] lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-2xl border border-hairline p-6">
          <SectionLabel>Candidate funnel</SectionLabel>
          <div className="mt-[18px] flex flex-col gap-3.5">
            {funnel.map((step, i) => (
              <div key={step.label}>
                <div className="mb-1.5 flex justify-between text-[13px] font-semibold">
                  <span>{step.label}</span>
                  <span className="text-muted">
                    {step.count} · {step.pct}%
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-[#EEE8DB]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${step.pct}%`,
                      backgroundColor: FUNNEL_COLORS[i] ?? FUNNEL_COLORS.at(-1),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-hairline p-6">
          <div className="mb-3.5 flex items-center justify-between">
            <SectionLabel>Completion rate</SectionLabel>
            <span className="text-xs font-semibold text-primary">8-week trend</span>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={completionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1ECE0" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#9A9C92" }} axisLine={false} />
                <YAxis hide domain={[60, 100]} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke="#1C6B47"
                  strokeWidth={2.5}
                  fill="#1C6B4714"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex justify-between text-[11px] font-medium text-faint-2">
            <span>8 wks ago</span>
            <span>This week · 86%</span>
          </div>
        </div>
      </div>

      <div className="grid gap-[18px] lg:grid-cols-[1.45fr_1fr]">
        <div className="overflow-hidden rounded-2xl border border-hairline">
          <div
            className="grid gap-3 border-b border-hairline bg-paper-2 px-[22px] py-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-faint-2"
            style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr" }}
          >
            <span>Role</span>
            <span>Invited</span>
            <span>Completion</span>
            <span>Avg score</span>
          </div>
          {roleStats.map((r, i) => (
            <div
              key={r.title}
              className={`grid items-center gap-3 px-[22px] py-3.5 text-[13.5px] font-semibold ${i < roleStats.length - 1 ? "border-b border-hairline-2" : ""}`}
              style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr" }}
            >
              <span>{r.title}</span>
              <span className="text-muted">{r.invited}</span>
              <span className="text-primary">{r.completion}%</span>
              <span className="text-muted">{r.avgScore}</span>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-hairline p-6">
          <SectionLabel>Where candidates drop off</SectionLabel>
          <div className="mt-5 flex items-end justify-between gap-3">
            {dropOff.map((d) => (
              <div key={d.question} className="flex min-w-0 flex-1 flex-col items-center">
                <span className="mb-2 text-[11px] font-semibold text-muted">{d.rate}%</span>
                <div className="flex h-[96px] w-full items-end overflow-hidden rounded-t-[7px] bg-primary-tint">
                  <div
                    className="w-full rounded-t-[7px] bg-primary"
                    style={{ height: `${d.rate}%` }}
                  />
                </div>
                <span className="mt-2 text-center text-[11px] font-semibold leading-tight text-faint-2">
                  {d.question}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
