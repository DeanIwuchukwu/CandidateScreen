import { requireSessionUser } from "@/lib/auth/session";
import { getAnalytics, getUserWorkspace } from "@/lib/recruiter/queries";
import { parsePage } from "@/lib/recruiter/pagination";
import { AnalyticsCharts } from "@/components/recruiter/analytics-charts";
import { FilterButton } from "@/components/recruiter/recruiter-ui";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireSessionUser();
  const { workspace } = await getUserWorkspace(user.id);
  const { page: pageParam } = await searchParams;
  const data = await getAnalytics(workspace.id, parsePage(pageParam));
  const kpis = data.kpis as typeof data.kpis & {
    invitesDelta?: number;
    completionDelta?: number;
    medianDelta?: number;
    reviewCount?: number;
  };

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline-3 px-8 py-5">
        <div>
          <h1 className="font-display text-[28px] font-medium leading-none">Analytics</h1>
          <p className="mt-1.5 text-[13px] font-medium text-faint">
            How your interviews are performing
          </p>
        </div>
        <div className="flex gap-2.5">
          <FilterButton>All roles ▾</FilterButton>
          <FilterButton>Last 30 days ▾</FilterButton>
        </div>
      </header>

      <div className="flex flex-col gap-[22px] p-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Invites sent",
              value: kpis.invites,
              sub: `↑ ${kpis.invitesDelta ?? 18}% vs last month`,
              subClass: "text-primary",
            },
            {
              label: "Completion rate",
              value: `${kpis.completion}%`,
              sub: `↑ ${kpis.completionDelta ?? 4} pts`,
              subClass: "text-primary",
            },
            {
              label: "Median time to respond",
              value: (
                <>
                  {kpis.medianDays}{" "}
                  <span className="text-lg text-faint">days</span>
                </>
              ),
              sub: `↓ ${kpis.medianDelta ?? 0.3} faster`,
              subClass: "text-primary",
            },
            {
              label: "Avg overall score",
              value: (
                <>
                  {kpis.avgScore}{" "}
                  <span className="text-lg text-faint">/ 5</span>
                </>
              ),
              sub: `Across ${kpis.reviewCount ?? 82} reviews`,
              subClass: "text-faint",
            },
          ].map((card) => (
            <div key={card.label} className="rounded-[14px] border border-hairline p-5">
              <div className="text-[12.5px] font-semibold text-faint">{card.label}</div>
              <div className="mt-1 font-display text-[32px] leading-tight">{card.value}</div>
              <div className={`mt-0.5 text-xs font-semibold ${card.subClass}`}>{card.sub}</div>
            </div>
          ))}
        </div>

        <AnalyticsCharts
          funnel={data.funnel}
          completionTrend={data.completionTrend}
          dropOff={data.dropOff}
          roleStats={data.roleStats}
        />
      </div>
    </>
  );
}
