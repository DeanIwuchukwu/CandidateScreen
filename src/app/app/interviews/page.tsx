import Link from "next/link";
import { Plus } from "lucide-react";
import { requireSessionUser } from "@/lib/auth/session";
import { getInterviews, getUserWorkspace } from "@/lib/recruiter/queries";
import { formatInterviewMeta } from "@/lib/recruiter/format";
import { Button } from "@/components/ui/button";
import {
  CountTabs,
  InterviewStatusDot,
  OwnerCell,
  PageHeader,
  ResponseProgress,
  SearchField,
  SortLabel,
  TableHeader,
} from "@/components/recruiter/recruiter-ui";

const tabs = ["All", "Active", "Draft", "Closed"] as const;

type InterviewRow = Awaited<ReturnType<typeof getInterviews>>[number] & {
  ownerMeta?: { firstName: string; initials: string; color: string };
};

export default async function InterviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireSessionUser();
  const { workspace } = await getUserWorkspace(user.id);
  const { tab = "All" } = await searchParams;

  const statusMap = {
    Active: "ACTIVE",
    Draft: "DRAFT",
    Closed: "CLOSED",
  } as const;

  const allInterviews = (await getInterviews(workspace.id)) as InterviewRow[];
  const interviews = (
    tab in statusMap
      ? await getInterviews(workspace.id, statusMap[tab as keyof typeof statusMap])
      : allInterviews
  ) as InterviewRow[];

  const counts = {
    All: allInterviews.length,
    Active: allInterviews.filter((i) => i.status === "ACTIVE").length,
    Draft: allInterviews.filter((i) => i.status === "DRAFT").length,
    Closed: allInterviews.filter((i) => i.status === "CLOSED").length,
  };

  const activeCount = counts.Active;

  return (
    <>
      <PageHeader
        title="Interviews"
        subtitle={`${counts.All} interviews · ${activeCount} active`}
        actions={
          <Link href="/app/interviews/new">
            <Button size="sm">
              <Plus size={16} /> New interview
            </Button>
          </Link>
        }
      />

      <div className="mt-[18px] px-8">
        <CountTabs
          tabs={tabs.map((t) => ({
            label: t,
            href: `/app/interviews?tab=${t}`,
            count: counts[t],
            active: tab === t,
          }))}
        />
      </div>

      <div className="px-8 pb-7 pt-[18px]">
        <div className="mb-3.5 flex items-center gap-2.5">
          <SearchField placeholder="Search interviews" />
          <SortLabel>Sorted by · Recently active</SortLabel>
        </div>

        <div className="overflow-hidden rounded-[14px] border border-hairline">
          <TableHeader
            columns={["Interview", "Status", "Responses", "Owner", ""]}
          />
          {interviews.map((interview) => {
            const responded = interview.invites.length;
            const invited = interview._count.invites;
            const owner = interview.ownerMeta ?? {
              firstName: interview.owner.name.split(" ")[0]!,
              initials: interview.owner.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase(),
              color: "#1C6B47",
            };
            const mutedTitle = interview.status === "CLOSED";

            const href =
              interview.status === "DRAFT"
                ? `/app/interviews/${interview.id}/build`
                : `/app/candidates?interview=${interview.id}`;

            return (
              <Link
                key={interview.id}
                href={href}
                className="grid items-center gap-4 border-b border-hairline-2 px-[22px] py-[15px] last:border-0 hover:bg-reviewed"
                style={{ gridTemplateColumns: "2.6fr 1fr 1.4fr 1.2fr 0.5fr" }}
              >
                <div>
                  <div
                    className={`text-[14.5px] font-semibold ${mutedTitle ? "text-muted" : "text-ink"}`}
                  >
                    {interview.title}
                  </div>
                  <div className="text-xs font-medium text-faint">
                    {formatInterviewMeta(
                      interview.status,
                      interview.createdAt,
                      interview.updatedAt,
                      interview.questions.length,
                    )}
                  </div>
                </div>
                <InterviewStatusDot status={interview.status} />
                <div>
                  {interview.status === "DRAFT" ? (
                    <span className="text-[13px] font-medium text-faint-2">
                      Not published
                    </span>
                  ) : (
                    <ResponseProgress
                      responded={responded}
                      invited={invited}
                      closed={interview.status === "CLOSED"}
                    />
                  )}
                </div>
                <OwnerCell
                  name={owner.firstName}
                  initials={owner.initials}
                  color={owner.color}
                />
                <div className="text-right text-lg font-bold text-faint-2">⋯</div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
