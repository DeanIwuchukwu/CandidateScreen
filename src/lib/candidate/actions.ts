"use server";

import { prisma } from "@/lib/db";
import {
  createVideoUploadUrl,
  isR2Storage,
  saveVideo,
  videoFileName,
  videoObjectKey,
} from "@/lib/storage";
import { ensureCandidateResponse } from "@/lib/candidate/invite";
import { mockTranscript, type CandidatePhase } from "@/lib/types";
import { isPreviewInviteEmail } from "@/lib/candidate/internal-invites";
import { isDevBypass } from "@/lib/dev/bypass";

async function isPreviewToken(token: string) {
  const invite = await prisma.invite.findUnique({
    where: { token },
    select: { email: true },
  });
  return isPreviewInviteEmail(invite?.email);
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

  const question = invite.interview.questions.find((q) => q.id === questionId);
  if (!question) return { error: "Question not found" as const };

  return { invite, question };
}

async function upsertAnswer(
  responseId: string,
  questionId: string,
  videoUrl: string,
  durationSec: number,
  autoTranscripts: boolean,
  questionText: string,
) {
  const existing = await prisma.answer.findUnique({
    where: {
      responseId_questionId: { responseId, questionId },
    },
  });

  const retakesUsed = existing ? existing.retakesUsed + 1 : 0;
  const transcript = autoTranscripts ? mockTranscript(questionText) : null;

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
      transcript,
    },
    update: {
      videoUrl,
      durationSec,
      retakesUsed,
      transcript,
    },
  });

  return { ok: true as const, videoUrl };
}

export async function startCandidateSession(token: string) {
  if (isDevBypass()) return { ok: true };
  const invite = await prisma.invite.findUnique({ where: { token } });
  if (!invite) return { error: "Invite not found" };

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

  await prisma.candidateResponse.update({
    where: { id: invite.response.id },
    data: { progressPhase: phase, currentQuestionIndex },
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
    ctx.invite.interview.autoTranscripts,
    ctx.question.text,
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
    ctx.invite.interview.autoTranscripts,
    ctx.question.text,
  );
}

export async function submitCandidateInterview(token: string) {
  if (isDevBypass()) return { ok: true };
  if (await isPreviewToken(token)) return { ok: true };
  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { response: true, interview: { include: { questions: true } } },
  });
  if (!invite?.response) return { error: "Session not found" };

  const answerCount = await prisma.answer.count({
    where: { responseId: invite.response.id },
  });
  if (answerCount < invite.interview.questions.length) {
    return { error: "Please answer all questions before submitting." };
  }

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

  return { ok: true };
}
