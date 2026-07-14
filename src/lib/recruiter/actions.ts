"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth/session";
import { getUserWorkspace } from "@/lib/recruiter/queries";
import type { CandidateDecision, CandidateStage, Prisma } from "@prisma/client";
import { RUBRIC_CRITERIA } from "@/lib/types";
import { isDevBypass } from "@/lib/dev/bypass";
import { MOCK_USER } from "@/lib/dev/mock-data";
import { ensureCandidateResponse } from "@/lib/candidate/invite";
import { isRealCandidateInvite } from "@/lib/candidate/internal-invites";
import {
  firstNameFromFullName,
  mergeInviteMessage,
  sendInterviewInviteEmail,
} from "@/lib/email";
import { resolveInterviewRoleFromForm } from "@/lib/recruiter/interview-role";
import { invitePublicUrl } from "@/lib/recruiter/invite-url";

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/** Avoid @@unique([interviewId, order]) collisions when reassigning order values. */
async function applyQuestionOrder(
  tx: Prisma.TransactionClient,
  interviewId: string,
  orderedIds: string[],
) {
  for (let i = 0; i < orderedIds.length; i++) {
    await tx.question.updateMany({
      where: { id: orderedIds[i], interviewId },
      data: { order: 10_000 + i },
    });
  }
  for (let i = 0; i < orderedIds.length; i++) {
    await tx.question.updateMany({
      where: { id: orderedIds[i], interviewId },
      data: { order: i },
    });
  }
}

async function workspaceGuard() {
  const user = await requireSessionUser();
  if (isDevBypass()) {
    return {
      user,
      workspace: MOCK_USER.memberships[0]!.workspace,
      role: "ADMIN" as const,
    };
  }
  const { workspace, role } = await getUserWorkspace(user.id);
  return { user, workspace, role };
}

export async function createInterviewAction(formData: FormData) {
  if (isDevBypass()) redirect("/app/interviews/demo-interview/build");
  const { user, workspace } = await workspaceGuard();
  const { title, jobId } = await resolveInterviewRoleFromForm(formData, workspace.id);

  const interview = await prisma.interview.create({
    data: {
      workspaceId: workspace.id,
      ownerId: user.id,
      jobId,
      title,
      questions: {
        create: [
          {
            order: 0,
            text: "Tell us about a project you're proud of.",
            timeLimitSec: 120,
            retakes: 2,
            thinkTimeSec: 3,
          },
        ],
      },
    },
  });

  redirect(`/app/interviews/${interview.id}/build`);
}

export async function updateInterviewAction(interviewId: string, formData: FormData) {
  if (isDevBypass()) {
    revalidatePath(`/app/interviews/${interviewId}/build`);
    return;
  }
  const { workspace } = await workspaceGuard();
  const { title, jobId } = await resolveInterviewRoleFromForm(formData, workspace.id);

  await prisma.interview.updateMany({
    where: { id: interviewId, workspaceId: workspace.id },
    data: {
      title,
      jobId,
      welcomeMessage: String(formData.get("welcomeMessage") || "") || null,
      deadlineDays: Number(formData.get("deadlineDays") || 7),
      allowRetakes: formData.get("allowRetakes") === "on",
      autoTranscripts: formData.get("autoTranscripts") === "on",
      requireIdCheck: formData.get("requireIdCheck") === "on",
    },
  });

  revalidatePath(`/app/interviews/${interviewId}/build`);
}

export async function updateQuestionAction(
  questionId: string,
  data: { text?: string; timeLimitSec?: number; retakes?: number; thinkTimeSec?: number },
) {
  const { workspace } = await workspaceGuard();
  const question = await prisma.question.findFirst({
    where: { id: questionId, interview: { workspaceId: workspace.id } },
  });
  if (!question) return;

  await prisma.question.update({
    where: { id: questionId },
    data,
  });
  revalidatePath(`/app/interviews/${question.interviewId}/build`);
}

export async function addQuestionAction(interviewId: string) {
  if (isDevBypass()) {
    revalidatePath(`/app/interviews/${interviewId}/build`);
    return;
  }
  const { workspace } = await workspaceGuard();
  const interview = await prisma.interview.findFirst({
    where: { id: interviewId, workspaceId: workspace.id },
    include: { questions: true },
  });
  if (!interview) return;

  await prisma.question.create({
    data: {
      interviewId,
      order: interview.questions.length,
      text: "New question",
      timeLimitSec: 120,
      retakes: 2,
      thinkTimeSec: 3,
    },
  });
  revalidatePath(`/app/interviews/${interviewId}/build`);
}

export async function reorderQuestionsAction(interviewId: string, orderedIds: string[]) {
  const { workspace } = await workspaceGuard();
  const interview = await prisma.interview.findFirst({
    where: { id: interviewId, workspaceId: workspace.id },
  });
  if (!interview) return;

  await prisma.$transaction((tx) => applyQuestionOrder(tx, interviewId, orderedIds));
  revalidatePath(`/app/interviews/${interviewId}/build`);
}

export async function deleteQuestionAction(questionId: string, interviewId: string) {
  if (isDevBypass()) {
    revalidatePath(`/app/interviews/${interviewId}/build`);
    return;
  }
  const { workspace } = await workspaceGuard();
  const interview = await prisma.interview.findFirst({
    where: { id: interviewId, workspaceId: workspace.id },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!interview || interview.questions.length <= 1) return;

  const question = interview.questions.find((q) => q.id === questionId);
  if (!question) return;

  const remainingIds = interview.questions
    .filter((q) => q.id !== questionId)
    .map((q) => q.id);

  await prisma.$transaction(async (tx) => {
    await tx.question.delete({ where: { id: questionId } });
    await applyQuestionOrder(tx, interviewId, remainingIds);
  });

  revalidatePath(`/app/interviews/${interviewId}/build`);
}

export async function deleteInterviewAction(
  interviewId: string,
): Promise<{ ok: true } | { ok: false; error: "not_found" | "has_responses" }> {
  if (isDevBypass()) {
    revalidatePath("/app/interviews");
    revalidatePath("/app/candidates");
    return { ok: true };
  }

  const { workspace } = await workspaceGuard();
  const interview = await prisma.interview.findFirst({
    where: { id: interviewId, workspaceId: workspace.id },
    include: {
      invites: {
        include: { response: { select: { submittedAt: true } } },
      },
    },
  });

  if (!interview) return { ok: false, error: "not_found" };

  const hasResponses = interview.invites.some(
    (invite) => invite.response?.submittedAt != null,
  );
  if (hasResponses) return { ok: false, error: "has_responses" };

  await prisma.interview.delete({ where: { id: interviewId } });

  revalidatePath("/app/interviews");
  revalidatePath("/app/candidates");
  revalidatePath("/app/analytics");
  return { ok: true };
}

import { getOrCreateShareInviteToken } from "@/lib/recruiter/share-invite";

export async function publishInterviewAction(interviewId: string) {
  if (isDevBypass()) return { ok: true as const, token: "demo-invite-token" };
  const { workspace } = await workspaceGuard();
  const interview = await prisma.interview.findFirst({
    where: { id: interviewId, workspaceId: workspace.id },
  });
  if (!interview) return { ok: false as const };

  await prisma.interview.update({
    where: { id: interviewId },
    data: { status: "ACTIVE", publishedAt: new Date() },
  });

  const token = await getOrCreateShareInviteToken(interviewId);

  revalidatePath("/app/interviews");
  revalidatePath(`/app/interviews/${interviewId}/build`);
  return { ok: true as const, token };
}

export async function saveReviewAction(
  responseId: string,
  data: {
    overallRating?: number;
    notes?: string;
    rubric?: Record<string, number>;
    decision?: CandidateDecision;
    stage?: CandidateStage;
  },
) {
  if (isDevBypass()) {
    revalidatePath(`/app/candidates/${responseId}/review`);
    return;
  }
  const { workspace } = await workspaceGuard();
  const response = await prisma.candidateResponse.findFirst({
    where: { id: responseId, invite: { interview: { workspaceId: workspace.id } } },
    include: { invite: true },
  });
  if (!response) return;

  await prisma.candidateResponse.update({
    where: { id: responseId },
    data: {
      overallRating: data.overallRating,
      notes: data.notes,
      decision: data.decision,
      stage: data.stage,
    },
  });

  if (data.rubric) {
    for (const criterion of RUBRIC_CRITERIA) {
      const rating = data.rubric[criterion];
      if (rating) {
        await prisma.rubricRating.upsert({
          where: { responseId_criterion: { responseId, criterion } },
          create: { responseId, criterion, rating },
          update: { rating },
        });
      }
    }
  }

  revalidatePath(`/app/candidates/${responseId}/review`);

  if (data.decision === "ADVANCE" && response.inviteId) {
    const { markApplicationPassedByInvite } = await import("@/lib/jobs/applications");
    await markApplicationPassedByInvite(response.inviteId);
  }
}

export async function updateWorkspaceAction(formData: FormData) {
  const { workspace, role } = await workspaceGuard();
  if (role !== "ADMIN") {
    redirect("/app/settings?error=forbidden");
  }

  await prisma.workspace.update({
    where: { id: workspace.id },
    data: {
      name: String(formData.get("name") || workspace.name),
      careersUrl: String(formData.get("careersUrl") || "") || null,
      accentColor: String(formData.get("accentColor") || workspace.accentColor),
    },
  });

  revalidatePath("/app/settings");
}

export async function submitContactAction(formData: FormData) {
  if (isDevBypass()) return;
  await prisma.contactMessage.create({
    data: {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      company: String(formData.get("company") || "") || null,
      teamSize: String(formData.get("teamSize") || "") || null,
      message: String(formData.get("message") || ""),
    },
  });
}

export async function inviteCandidateToInterviewAction(
  interviewId: string,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isDevBypass()) return { ok: true };

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (name.length < 2 || !email.includes("@")) {
    return { ok: false, error: "Enter a valid name and email." };
  }

  const result = await inviteCandidatesBulkToInterviewAction(interviewId, [
    { name, email },
  ]);
  if (!result.ok) return result;
  if (result.failed.length > 0) {
    return { ok: false, error: result.failed[0]!.error };
  }
  return { ok: true };
}

export async function inviteCandidatesBulkToInterviewAction(
  interviewId: string,
  candidates: Array<{ name: string; email: string }>,
): Promise<
  | { ok: true; sent: number; failed: Array<{ email: string; error: string }> }
  | { ok: false; error: string }
> {
  if (isDevBypass()) return { ok: true, sent: candidates.length, failed: [] };

  const cleaned = candidates
    .map((c) => ({
      name: c.name.trim(),
      email: c.email.trim().toLowerCase(),
    }))
    .filter((c) => c.email.includes("@"));

  if (cleaned.length === 0) {
    return { ok: false, error: "Add at least one valid email." };
  }

  const { user, workspace } = await workspaceGuard();
  const interview = await prisma.interview.findFirst({
    where: {
      id: interviewId,
      workspaceId: workspace.id,
      status: { in: ["ACTIVE", "CLOSED"] },
    },
  });
  if (!interview) return { ok: false, error: "Interview not found." };

  const expiresAt = new Date(Date.now() + interview.deadlineDays * 86400000);
  const failed: Array<{ email: string; error: string }> = [];
  let sent = 0;

  for (const candidate of cleaned) {
    const name =
      candidate.name.length >= 2
        ? candidate.name
        : candidate.email.split("@")[0] || "Candidate";

    try {
      const existing = await prisma.invite.findFirst({
        where: { interviewId, email: candidate.email },
      });
      if (existing && isRealCandidateInvite(existing)) {
        failed.push({ email: candidate.email, error: "Already invited" });
        continue;
      }

      const invite = await prisma.invite.create({
        data: {
          interviewId,
          email: candidate.email,
          candidateName: name,
          expiresAt,
        },
      });

      await ensureCandidateResponse(invite.id);

      const firstName = firstNameFromFullName(name);
      const message = mergeInviteMessage(
        `Hi [First name] — we'd love to hear from you. Here's a short video interview you can record whenever suits you.`,
        firstName,
      );

      await sendInterviewInviteEmail({
        to: candidate.email,
        candidateName: name,
        jobTitle: interview.title,
        message,
        inviteUrl: invitePublicUrl(invite.token, appUrl()),
        senderName: user.name,
        workspaceName: workspace.name,
      });

      sent++;
    } catch (err) {
      console.error("[email] bulk candidate invite failed", candidate.email, err);
      failed.push({ email: candidate.email, error: "Send failed" });
    }
  }

  revalidatePath("/app/candidates");
  revalidatePath(`/app/candidates?interview=${interviewId}`);
  return { ok: true, sent, failed };
}
