import { notFound } from "next/navigation";
import { requireSessionUser } from "@/lib/auth/session";
import { getUserWorkspace } from "@/lib/recruiter/queries";
import { getJobById } from "@/lib/jobs/queries";
import { JobListingForm } from "@/components/recruiter/job-listing-form";

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireSessionUser();
  const { workspace } = await getUserWorkspace(user.id);
  const job = await getJobById(workspace.id, id);
  if (!job) notFound();

  return <JobListingForm job={job} mode="edit" />;
}
