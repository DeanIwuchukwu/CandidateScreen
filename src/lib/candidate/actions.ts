"use server";

import { prisma } from "@/lib/db";
import { saveVideo, videoFileName } from "@/lib/storage";
import { ensureCandidateResponse } from "@/lib/candidate/invite";
import { mockTranscript, type CandidatePhase } from "@/lib/types";
import { isDevBypass } from "@/lib/dev/bypass";

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

export async function uploadCandidateAnswer(
  token: string,
  questionId: string,
  formData: FormData,
) {
  if (isDevBypass()) return { ok: true, videoUrl: null };
  const invite = await prisma.invite.findUnique({
    where: { token },
    include: {
      response: true,
      interview: { include: { questions: true } },
    },
  });
  if (!invite?.response) return { error: "Session not found" };

  const file = formData.get("video") as File | null;
  if (!file) return { error: "No video provided" };

  const question = invite.interview.questions.find((q) => q.id === questionId);
  if (!question) return { error: "Question not found" };

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = videoFileName(invite.response.id, questionId);
  const videoUrl = await saveVideo(fileName, buffer);

  const existing = await prisma.answer.findUnique({
    where: {
      responseId_questionId: {
        responseId: invite.response.id,
        questionId,
      },
    },
  });

  const retakesUsed = existing ? existing.retakesUsed + 1 : 0;
  const durationSec = Number(formData.get("durationSec") || 0);
  const transcript = invite.interview.autoTranscripts
    ? mockTranscript(question.text)
    : null;

  await prisma.answer.upsert({
    where: {
      responseId_questionId: {
        responseId: invite.response.id,
        questionId,
      },
    },
    create: {
      responseId: invite.response.id,
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

  return { ok: true, videoUrl };
}

export async function submitCandidateInterview(token: string) {
  if (isDevBypass()) return { ok: true };
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

  return { ok: true };
}
