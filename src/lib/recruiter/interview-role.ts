import { prisma } from "@/lib/db";

export async function resolveInterviewRoleFromForm(
  formData: FormData,
  workspaceId: string,
): Promise<{ title: string; jobId: string | null }> {
  const titleInput = String(formData.get("title") || "").trim();
  const jobIdRaw = String(formData.get("jobId") || "").trim();

  if (jobIdRaw) {
    const job = await prisma.job.findFirst({
      where: { id: jobIdRaw, workspaceId },
    });
    if (job) {
      return { title: titleInput || job.title, jobId: job.id };
    }
  }

  return {
    title: titleInput || "Untitled interview",
    jobId: null,
  };
}
