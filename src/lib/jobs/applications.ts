import { prisma } from "@/lib/db";
import { isDevBypass } from "@/lib/dev/bypass";

export async function markApplicationInterviewedByInvite(inviteId: string) {
  if (isDevBypass()) return;
  await prisma.jobApplication.updateMany({
    where: { inviteId },
    data: { stage: "INTERVIEWED" },
  });
}

export async function markApplicationPassedByInvite(inviteId: string) {
  if (isDevBypass()) return;
  await prisma.jobApplication.updateMany({
    where: { inviteId },
    data: { stage: "PASSED" },
  });
}
