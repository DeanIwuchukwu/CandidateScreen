import { notFound } from "next/navigation";
import { PublicJobContent } from "@/components/jobs/public-job-page";
import { getJobBySlug } from "@/lib/jobs/queries";

export default async function PublicJobPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) notFound();

  const { workspaceName, ...jobData } = job;
  return <PublicJobContent job={jobData} workspaceName={workspaceName} />;
}
