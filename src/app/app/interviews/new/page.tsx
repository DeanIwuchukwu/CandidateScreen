import { requireSessionUser } from "@/lib/auth/session";
import { getJobsForRolePicker } from "@/lib/jobs/queries";
import { getUserWorkspace } from "@/lib/recruiter/queries";
import { CreateInterviewForm } from "@/components/recruiter/create-interview-form";

export default async function NewInterviewPage() {
  const user = await requireSessionUser();
  const { workspace } = await getUserWorkspace(user.id);
  const jobs = await getJobsForRolePicker(workspace.id);

  return <CreateInterviewForm jobs={jobs} />;
}
