"use server";

import { prisma } from "@/lib/db";
import {
  createVideoUploadUrl,
  isR2Storage,
  saveVideo,
  videoFileName,
  videoObjectKey,
} from "@/lib/storage";
import { ensureCandidateResponse, inviteNeedsIdentity } from "@/lib/candidate/invite";
import type { CandidatePhase } from "@/lib/types";
import {
  isInternalInviteEmail,
  isPreviewInviteEmail,
  isShareInviteEmail,
} from "@/lib/candidate/internal-invites";
import { isDevBypass } from "@/lib/dev/bypass";
import { createToken } from "@/lib/auth/crypto";
import { sendInterviewSubmittedEmail } from "@/lib/email";

async function isPreviewToken(token: string) {
  const invite = await prisma.invite.findUnique({
    where: { token },
    select: { email: true },
  });
  return isPreviewInviteEmail(invite?.email);
}

/**
 * Share-link template invites stay reusable. Each "Get started" forks a
 * personal invite + response so concurrent candidates don't share progress.
 */
async function forkShareInviteSession(templateInvite: {
  id: string;
  interviewId: string;
  expiresAt: Date | null;
}) {
  const forked = await prisma.invite.create({
    data: {
      interviewId: templateInvite.interviewId,
      token: createToken(),
      email: null,
      candidateName: null,
      expiresAt: templateInvite.expiresAt,
      status: "STARTED",
    },
  });

  const response = await ensureCandidateResponse(forked.id);
  await prisma.candidateResponse.update({
    where: { id: response.id },
    data: { progressPhase: "identity", currentQuestionIndex: 0 },
  });

  return forked.token;
}

async function getInviteContext(token: string, questionId: string) {
  const invite = await prisma.invite.findUnique({
    where: { token },
    include: {
      response: true,
      interview: { include: { questions: true } },
    },
  });
  if (!invite?.response) return { error: "Session not found" as const };

  // Never write answers onto the reusable share template invite
  if (isShareInviteEmail(invite.email)) {
    return { error: "Session not found" as const };
  }

  const question = invite.interview.questions.find((q) => q.id === questionId);
  if (!question) return { error: "Question not found" as const };

  return { invite, question };
}

async function upsertAnswer(
  responseId: string,
  questionId: string,
  videoUrl: string,
  durationSec: number,
) {
  const existing = await prisma.answer.findUnique({
    where: {
      responseId_questionId: { responseId, questionId },
    },
  });

  const retakesUsed = existing ? existing.retakesUsed + 1 : 0;

  await prisma.answer.upsert({
    where: {
      responseId_questionId: { responseId, questionId },
    },
    create: {
      responseId,
      questionId,
      videoUrl,
      durationSec,
      retakesUsed,
      transcript: null,
    },
    update: {
      videoUrl,
      durationSec,
      retakesUsed,
    },
  });

  return { ok: true as const, videoUrl };
}

export async function startCandidateSession(
  token: string,
): Promise<{ ok: true; token?: string } | { error: string }> {
  if (isDevBypass()) return { ok: true };
  const invite = await prisma.invite.findUnique({ where: { token } });
  if (!invite) return { error: "Invite not found" };

  // Public copy-link: mint a personal invite so each visitor has an independent session
  if (isShareInviteEmail(invite.email)) {
    const forkedToken = await forkShareInviteSession(invite);
    return { ok: true, token: forkedToken };
  }

  const response = await ensureCandidateResponse(invite.id);
  await prisma.invite.update({
    where: { id: invite.id },
    data: { status: "STARTED" },
  });
  await prisma.candidateResponse.update({
    where: { id: response.id },
    data: { progressPhase: "setup", currentQuestionIndex: 0 },
  });
  return { ok: true };
}

export async function saveCandidateProgress(
  token: string,
  phase: CandidatePhase,
  currentQuestionIndex: number,
) {
  if (isDevBypass()) return { ok: true };
  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { response: true },
  });
  if (!invite?.response) return { error: "Session not found" };
  if (isShareInviteEmail(invite.email)) {
    return { error: "Use Get started to begin your own session" };
  }

  // Share-link sessions must finish About you before leaving this phase
  if (
    inviteNeedsIdentity(invite.email) &&
    phase !== "identity" &&
    phase !== "intro" &&
    phase !== "done"
  ) {
    await prisma.candidateResponse.update({
      where: { id: invite.response.id },
      data: { progressPhase: "identity", currentQuestionIndex: 0 },
    });
    return { ok: true };
  }

  await prisma.candidateResponse.update({
    where: { id: invite.response.id },
    data: { progressPhase: phase, currentQuestionIndex },
  });
  return { ok: true };
}

export async function saveCandidateIdentity(
  token: string,
  input: { name: string; email: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isDevBypass()) return { ok: true };

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (name.length < 2) return { ok: false, error: "Enter your full name." };
  if (!email.includes("@") || email.length < 5) {
    return { ok: false, error: "Enter a valid email address." };
  }
  if (isInternalInviteEmail(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { response: true },
  });
  if (!invite?.response) return { ok: false, error: "Session not found" };
  if (isShareInviteEmail(invite.email)) {
    return { ok: false, error: "Use Get started to begin your own session" };
  }
  if (!inviteNeedsIdentity(invite.email)) {
    await prisma.candidateResponse.update({
      where: { id: invite.response.id },
      data: { progressPhase: "setup", currentQuestionIndex: 0 },
    });
    return { ok: true };
  }

  await prisma.invite.update({
    where: { id: invite.id },
    data: { candidateName: name, email },
  });
  await prisma.candidateResponse.update({
    where: { id: invite.response.id },
    data: { progressPhase: "setup", currentQuestionIndex: 0 },
  });

  return { ok: true };
}

export async function prepareVideoUpload(token: string, questionId: string) {
  if (isDevBypass()) return { ok: true as const, useR2: false as const };
  if (await isPreviewToken(token)) return { ok: true as const, useR2: false as const };
  if (!isR2Storage()) return { ok: true as const, useR2: false as const };

  const ctx = await getInviteContext(token, questionId);
  if ("error" in ctx) return { ok: false as const, error: ctx.error };

  const objectKey = videoObjectKey(ctx.invite.response!.id, questionId);
  const uploadUrl = await createVideoUploadUrl(objectKey);

  return { ok: true as const, useR2: true as const, uploadUrl, objectKey };
}

export async function completeVideoUpload(
  token: string,
  questionId: string,
  objectKey: string,
  durationSec: number,
) {
  if (isDevBypass()) return { ok: true, videoUrl: null };
  if (await isPreviewToken(token)) return { ok: true, videoUrl: null };
  const ctx = await getInviteContext(token, questionId);
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const expectedKey = videoObjectKey(ctx.invite.response!.id, questionId);
  if (objectKey !== expectedKey) return { ok: false, error: "Invalid upload" };

  return upsertAnswer(
    ctx.invite.response!.id,
    questionId,
    objectKey,
    durationSec,
  );
}

export async function uploadCandidateAnswer(
  token: string,
  questionId: string,
  formData: FormData,
) {
  if (isDevBypass()) return { ok: true, videoUrl: null };
  if (await isPreviewToken(token)) return { ok: true, videoUrl: null };
  const ctx = await getInviteContext(token, questionId);
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const file = formData.get("video") as File | null;
  if (!file) return { ok: false, error: "No video provided" };

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = videoFileName(ctx.invite.response!.id, questionId);
  const videoUrl = await saveVideo(fileName, buffer);
  const durationSec = Number(formData.get("durationSec") || 0);

  return upsertAnswer(
    ctx.invite.response!.id,
    questionId,
    videoUrl,
    durationSec,
  );
}

export async function submitCandidateInterview(token: string) {
  if (isDevBypass()) return { ok: true };
  if (await isPreviewToken(token)) return { ok: true };
  const invite = await prisma.invite.findUnique({
    where: { token },
    include: {
      response: true,
      interview: { include: { questions: true, workspace: true } },
    },
  });
  if (!invite?.response) return { error: "Session not found" };
  if (isShareInviteEmail(invite.email)) {
    return { error: "Session not found" };
  }

  const answerCount = await prisma.answer.count({
    where: { responseId: invite.response.id },
  });
  if (answerCount < invite.interview.questions.length) {
    return { error: "Please answer all questions before submitting." };
  }

  const alreadySubmitted = Boolean(invite.response.submittedAt);

  await prisma.candidateResponse.update({
    where: { id: invite.response.id },
    data: {
      submittedAt: new Date(),
      progressPhase: "done",
    },
  });
  await prisma.invite.update({
    where: { id: invite.id },
    data: { status: "COMPLETED" },
  });

  const { markApplicationInterviewedByInvite } = await import("@/lib/jobs/applications");
  await markApplicationInterviewedByInvite(invite.id);

  const to = invite.email?.trim();
  if (
    !alreadySubmitted &&
    to &&
    !isInternalInviteEmail(to)
  ) {
    const questionCount = invite.interview.questions.length;
    const submittedDate = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    void sendInterviewSubmittedEmail({
      to,
      candidateName: invite.candidateName,
      jobTitle: invite.interview.title,
      workspaceName: invite.interview.workspace.name,
      answeredLabel: `${questionCount}/${questionCount}`,
      submittedDate,
    }).catch((err) => console.error("[email] submission confirmation failed", err));
  }

  return { ok: true };
}
