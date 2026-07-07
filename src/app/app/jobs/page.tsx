import Link from "next/link";
import { Plus } from "lucide-react";
import { requireSessionUser } from "@/lib/auth/session";
import { getUserWorkspace } from "@/lib/recruiter/queries";
import {
  getJobApplicantCount,
  getJobs,
  getJobsSummary,
  getJobTabCounts,
} from "@/lib/jobs/queries";
import { JobListCard } from "@/components/recruiter/job-list-card";
import { CountTabs, PageHeader } from "@/components/recruiter/recruiter-ui";
import { Button } from "@/components/ui/button";
import type { JobStatus } from "@/lib/jobs/types";

const tabs = ["All", "Open", "Draft", "Closed"] as const;

const statusMap = {
  Open: "OPEN",
  Draft: "DRAFT",
  Closed: "CLOSED",
} as const satisfies Record<Exclude<(typeof tabs)[number], "All">, JobStatus>;

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireSessionUser();
  const { workspace } = await getUserWorkspace(user.id);
  const { tab = "All" } = await searchParams;

  const status = tab in statusMap ? statusMap[tab as keyof typeof statusMap] : undefined;

  const [counts, summary, jobs] = await Promise.all([
    getJobTabCounts(workspace.id),
    getJobsSummary(workspace.id),
    getJobs(workspace.id, status),
  ]);

  const applicantCounts = await Promise.all(
    jobs.map((job) => getJobApplicantCount(job.id)),
  );

  return (
    <>
      <PageHeader
        title="Jobs"
        subtitle={`${summary.totalListings} listings · ${summary.openListings} open · ${summary.totalApplicants} total applicants`}
        actions={
          <Link href="/app/jobs/new">
            <Button size="sm">
              <Plus size={16} /> New job listing
            </Button>
          </Link>
        }
      />

      <div className="mt-[18px] px-8">
        <CountTabs
          tabs={tabs.map((t) => ({
            label: t,
            href: t === "All" ? "/app/jobs" : `/app/jobs?tab=${t}`,
            count: counts[t],
            active: tab === t,
          }))}
        />
      </div>

      <div className="flex flex-col gap-3 px-8 pb-8 pt-5">
        {jobs.map((job, i) => (
          <JobListCard key={job.id} job={job} applicantCount={applicantCounts[i]!} />
        ))}
      </div>
    </>
  );
}
