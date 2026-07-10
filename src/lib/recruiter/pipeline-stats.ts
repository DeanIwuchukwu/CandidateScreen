import { prisma } from "@/lib/db";
import { isRealCandidateInvite } from "@/lib/candidate/internal-invites";
import { getOrCreateShareInviteToken } from "@/lib/recruiter/share-invite";

export async function getInterviewPipelineStats(workspaceId: string, interviewId: string) {
  const interview = await prisma.interview.findFirst({
    where: { id: interviewId, workspaceId },
    select: {
      id: true,
      title: true,
      status: true,
      invites: {
        select: { id: true, status: true, email: true, candidateName: true },
      },
    },
  });

  if (!interview) return null;

  const candidateInvites = interview.invites.filter(isRealCandidateInvite);
  const shareToken =
    interview.status !== "DRAFT"
      ? await getOrCreateShareInviteToken(interviewId)
      : null;

  return {
    invited: candidateInvites.length,
    started: candidateInvites.filter((i) => i.status !== "PENDING").length,
    completed: candidateInvites.filter((i) => i.status === "COMPLETED").length,
    shareToken,
  };
}
