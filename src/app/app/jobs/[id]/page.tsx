import { notFound } from "next/navigation";
import { requireSessionUser } from "@/lib/auth/session";
import { getUserWorkspace } from "@/lib/recruiter/queries";
import {
  getApplicationTabCounts,
  getInterviewInviteOptions,
  getJobApplications,
  getJobById,
} from "@/lib/jobs/queries";
import { resolveMediaUrl } from "@/lib/storage";
import { JobApplicantsView } from "@/components/recruiter/job-applicants-view";

export default async function JobApplicantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireSessionUser();
  const { workspace } = await getUserWorkspace(user.id);
  const job = await getJobById(workspace.id, id);
  if (!job) notFound();

  const [applicationsRaw, tabCounts, interviews] = await Promise.all([
    getJobApplications(job.id),
    getApplicationTabCounts(job.id),
    getInterviewInviteOptions(workspace.id),
  ]);

  const applications = await Promise.all(
    applicationsRaw.map(async (app) => ({
      ...app,
      resumeUrl: await resolveMediaUrl(app.resumeUrl),
    })),
  );

  return (
    <JobApplicantsView
      job={job}
      applications={applications}
      tabCounts={tabCounts}
      interviews={interviews}
    />
  );
}
