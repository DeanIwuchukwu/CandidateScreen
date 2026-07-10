import { prisma } from "@/lib/db";
import { createToken } from "@/lib/auth/crypto";
import { isDevBypass } from "@/lib/dev/bypass";
import { previewInviteEmail } from "@/lib/candidate/internal-invites";

async function resetPreviewSession(inviteId: string) {
  const response = await prisma.candidateResponse.findUnique({ where: { inviteId } });
  if (!response) {
    await prisma.invite.update({ where: { id: inviteId }, data: { status: "PENDING" } });
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.answer.deleteMany({ where: { responseId: response.id } });
    await tx.candidateResponse.delete({ where: { id: response.id } });
    await tx.invite.update({ where: { id: inviteId }, data: { status: "PENDING" } });
  });
}

/** Stable preview link for recruiters building a draft interview. */
export async function getPreviewInviteToken(interviewId: string, workspaceId: string) {
  if (isDevBypass()) return "demo-invite-token";

  const interview = await prisma.interview.findFirst({
    where: { id: interviewId, workspaceId },
  });
  if (!interview) return null;

  const email = previewInviteEmail(interviewId);
  let invite = await prisma.invite.findFirst({
    where: { interviewId, email },
  });

  if (!invite) {
    invite = await prisma.invite.create({
      data: {
        interviewId,
        email,
        candidateName: "Preview",
        token: createToken(),
      },
    });
  } else {
    await resetPreviewSession(invite.id);
  }

  return invite.token;
}
