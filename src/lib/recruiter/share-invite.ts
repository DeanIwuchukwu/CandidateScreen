import { prisma } from "@/lib/db";
import { createToken } from "@/lib/auth/crypto";
import { isDevBypass } from "@/lib/dev/bypass";
import { shareInviteEmail } from "@/lib/candidate/internal-invites";

/** Reusable candidate link for a published interview. */
export async function getOrCreateShareInviteToken(interviewId: string) {
  if (isDevBypass()) return "demo-invite-token";

  const email = shareInviteEmail(interviewId);
  const existing = await prisma.invite.findFirst({
    where: { interviewId, email },
    select: { token: true },
  });
  if (existing) return existing.token;

  const invite = await prisma.invite.create({
    data: {
      interviewId,
      email,
      token: createToken(),
    },
  });
  return invite.token;
}
