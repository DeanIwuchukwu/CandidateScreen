import { prisma } from "@/lib/db";
import type { CandidatePhase, InvitePayload } from "@/lib/types";
import { isDevBypass } from "@/lib/dev/bypass";
import { mockInvitePayload } from "@/lib/dev/mock-data";

export async function getInvitePayload(token: string): Promise<InvitePayload> {
  if (isDevBypass()) return mockInvitePayload(token);

  const invite = await prisma.invite.findUnique({
    where: { token },
    include: {
      interview: {
        include: {
          workspace: true,
          owner: true,
          questions: { orderBy: { order: "asc" } },
        },
      },
      response: {
        include: { answers: true },
      },
    },
  });

  if (!invite) {
    return emptyPayload(token, "not_found");
  }

  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return emptyPayload(token, "expired", invite);
  }

  if (invite.status === "COMPLETED" || invite.response?.submittedAt) {
    return emptyPayload(token, "completed", invite);
  }

  if (invite.interview.status === "CLOSED") {
    return emptyPayload(token, "expired", invite);
  }

  const response = invite.response;
  const uploadedQuestionIds = response?.answers.map((a) => a.questionId) ?? [];
  const retakesUsed: Record<string, number> = {};
  response?.answers.forEach((a) => {
    retakesUsed[a.questionId] = a.retakesUsed;
  });

  return {
    token,
    gate: "valid",
    inviteId: invite.id,
    responseId: response?.id ?? null,
    candidateName: invite.candidateName,
    interview: {
      id: invite.interview.id,
      title: invite.interview.title,
      welcomeMessage: invite.interview.welcomeMessage,
      allowRetakes: invite.interview.allowRetakes,
      workspaceName: invite.interview.workspace.name,
      careersUrl: invite.interview.workspace.careersUrl,
    },
    questions: invite.interview.questions.map((q) => ({
      id: q.id,
      order: q.order,
      text: q.text,
      timeLimitSec: q.timeLimitSec,
      retakes: q.retakes,
      thinkTimeSec: q.thinkTimeSec,
    })),
    progress: {
      phase: (response?.progressPhase as CandidatePhase) ?? "intro",
      currentQuestionIndex: response?.currentQuestionIndex ?? 0,
      retakesUsed,
      uploadedQuestionIds,
    },
    recruiterName: invite.interview.owner.name,
  };
}

function emptyPayload(
  token: string,
  gate: InvitePayload["gate"],
  invite?: {
    id: string;
    candidateName: string | null;
    interview: {
      id: string;
      title: string;
      welcomeMessage: string | null;
      allowRetakes: boolean;
      workspace: { name: string; careersUrl: string | null };
      owner: { name: string };
      questions: Array<{
        id: string;
        order: number;
        text: string;
        timeLimitSec: number;
        retakes: number;
        thinkTimeSec: number;
      }>;
    };
    response: { id: string; submittedAt: Date | null } | null;
  },
): InvitePayload {
  return {
    token,
    gate,
    inviteId: invite?.id ?? "",
    responseId: invite?.response?.id ?? null,
    candidateName: invite?.candidateName ?? null,
    interview: {
      id: invite?.interview.id ?? "",
      title: invite?.interview.title ?? "Interview",
      welcomeMessage: invite?.interview.welcomeMessage ?? null,
      allowRetakes: invite?.interview.allowRetakes ?? true,
      workspaceName: invite?.interview.workspace.name ?? "Company",
      careersUrl: invite?.interview.workspace.careersUrl ?? null,
    },
    questions:
      invite?.interview.questions.map((q) => ({
        id: q.id,
        order: q.order,
        text: q.text,
        timeLimitSec: q.timeLimitSec,
        retakes: q.retakes,
        thinkTimeSec: q.thinkTimeSec,
      })) ?? [],
    progress: {
      phase: "intro",
      currentQuestionIndex: 0,
      retakesUsed: {},
      uploadedQuestionIds: [],
    },
    recruiterName: invite?.interview.owner.name ?? "Recruiter",
  };
}

export async function ensureCandidateResponse(inviteId: string) {
  if (isDevBypass()) {
    return {
      id: "demo-response",
      inviteId,
      stage: "TO_REVIEW" as const,
      decision: null,
      overallRating: null,
      notes: null,
      submittedAt: null,
      progressPhase: "setup",
      currentQuestionIndex: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  const existing = await prisma.candidateResponse.findUnique({ where: { inviteId } });
  if (existing) return existing;

  return prisma.candidateResponse.create({
    data: { inviteId },
  });
}
