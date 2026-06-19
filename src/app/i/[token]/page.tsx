import { getInvitePayload } from "@/lib/candidate/invite";
import { CandidateFlow } from "@/components/candidate/candidate-flow";

export default async function CandidateInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await getInvitePayload(token);

  return <CandidateFlow data={data} />;
}
