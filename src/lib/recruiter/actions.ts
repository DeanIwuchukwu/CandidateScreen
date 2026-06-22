"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth/session";
import { getUserWorkspace } from "@/lib/recruiter/queries";
import type { CandidateDecision, CandidateStage } from "@prisma/client";
import { RUBRIC_CRITERIA } from "@/lib/types";
import { isDevBypass } from "@/lib/dev/bypass";
import { MOCK_USER } from "@/lib/dev/mock-data";

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
  const title = String(formData.get("title") || "Untitled interview");

  const interview = await prisma.interview.create({
    data: {
      workspaceId: workspace.id,
      ownerId: user.id,
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

  await prisma.interview.updateMany({
    where: { id: interviewId, workspaceId: workspace.id },
    data: {
      title: String(formData.get("title") || ""),
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

export async function addQuestionAction(interviewId: string, _formData?: FormData) {
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

  await Promise.all(
    orderedIds.map((id, order) =>
      prisma.question.updateMany({ where: { id, interviewId }, data: { order } }),
    ),
  );
  revalidatePath(`/app/interviews/${interviewId}/build`);
}

export async function publishInterviewAction(interviewId: string) {
  if (isDevBypass()) return { token: "demo-invite-token" };
  const { workspace } = await workspaceGuard();
  const interview = await prisma.interview.findFirst({
    where: { id: interviewId, workspaceId: workspace.id },
  });
  if (!interview) return;

  const invite = await prisma.invite.create({
    data: {
      interviewId,
      candidateName: "Demo Candidate",
      expiresAt: new Date(Date.now() + interview.deadlineDays * 86400000),
    },
  });

  await prisma.interview.update({
    where: { id: interviewId },
    data: { status: "ACTIVE", publishedAt: new Date() },
  });

  revalidatePath("/app/interviews");
  return { token: invite.token };
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
}

export async function updateWorkspaceAction(formData: FormData) {
  const { workspace } = await workspaceGuard();

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
