import Link from "next/link";
import { Plus } from "lucide-react";
import { requireSessionUser } from "@/lib/auth/session";
import {
  getInterviewTabCounts,
  getInterviewsPaginated,
  getUserWorkspace,
} from "@/lib/recruiter/queries";
import { parsePage } from "@/lib/recruiter/pagination";
import { Button } from "@/components/ui/button";
import {
  InterviewListRow,
  type InterviewListRowData,
} from "@/components/recruiter/interview-list-row";
import {
  CountTabs,
  PageHeader,
  SearchField,
  SortLabel,
  TABLE_GRID_STANDARD,
  TableHeader,
  TablePagination,
} from "@/components/recruiter/recruiter-ui";

const tabs = ["All", "Active", "Draft", "Closed"] as const;

type InterviewRow = Awaited<
  ReturnType<typeof getInterviewsPaginated>
>["items"][number] & {
  ownerMeta?: { firstName: string; initials: string; color: string };
};

function toListRow(interview: InterviewRow): InterviewListRowData {
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

  return {
    id: interview.id,
    title: interview.title,
    status: interview.status,
    createdAt: interview.createdAt.toISOString(),
    updatedAt: interview.updatedAt.toISOString(),
    questionCount: interview.questions.length,
    invited: interview._count.invites,
    responded: interview.invites.length,
    hasCandidateResponses: interview.invites.length > 0,
    owner,
  };
}

export default async function InterviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  const user = await requireSessionUser();
  const { workspace } = await getUserWorkspace(user.id);
  const { tab = "All", page: pageParam } = await searchParams;
  const page = parsePage(pageParam);

  const statusMap = {
    Active: "ACTIVE",
    Draft: "DRAFT",
    Closed: "CLOSED",
  } as const;

  const [counts, interviewsPage] = await Promise.all([
    getInterviewTabCounts(workspace.id),
    getInterviewsPaginated(workspace.id, {
      status: tab in statusMap ? statusMap[tab as keyof typeof statusMap] : undefined,
      page,
    }),
  ]);

  const interviews = interviewsPage.items as InterviewRow[];

  return (
    <>
      <PageHeader
        title="Interviews"
        subtitle={`${counts.All} interviews · ${counts.Active} active`}
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
            gridTemplate={TABLE_GRID_STANDARD}
          />
          {interviews.map((interview) => (
            <InterviewListRow key={interview.id} interview={toListRow(interview)} />
          ))}
          <TablePagination
            pagination={interviewsPage}
            basePath="/app/interviews"
            query={{ tab }}
          />
        </div>
      </div>
    </>
  );
}
