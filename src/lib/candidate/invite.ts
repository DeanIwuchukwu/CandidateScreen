import { prisma } from "@/lib/db";
import type { CandidatePhase, InvitePayload } from "@/lib/types";
import {
  isPreviewInviteEmail,
  isShareInviteEmail,
} from "@/lib/candidate/internal-invites";
import { isDevBypass } from "@/lib/dev/bypass";
import { mockInvitePayload } from "@/lib/dev/mock-data";
import { resolveMediaUrl } from "@/lib/storage";

/** Personal sessions without an email (typically share-link forks) need About you. */
export function inviteNeedsIdentity(email: string | null | undefined) {
  return !email?.trim();
}

export async function getInvitePayload(token: string): Promise<InvitePayload> {
  if (isDevBypass()) {
    const payload = mockInvitePayload(token);
    return { ...payload, isPreview: false };
  }

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

  const logoUrl = await resolveMediaUrl(invite.interview.workspace.logoUrl);
  const inviteWithLogo = {
    ...invite,
    interview: {
      ...invite.interview,
      workspace: { ...invite.interview.workspace, logoUrl },
    },
  };

  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return emptyPayload(token, "expired", inviteWithLogo);
  }

  // Share template link is never "completed" — each visitor forks their own session
  const isShareTemplate = isShareInviteEmail(invite.email);

  if (
    !isShareTemplate &&
    (invite.status === "COMPLETED" || invite.response?.submittedAt)
  ) {
    return emptyPayload(token, "completed", inviteWithLogo);
  }

  if (invite.interview.status === "CLOSED") {
    return emptyPayload(token, "expired", inviteWithLogo);
  }

  const response = isShareTemplate ? null : invite.response;
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
    needsIdentity: !isShareTemplate && inviteNeedsIdentity(invite.email),
    interview: {
      id: invite.interview.id,
      title: invite.interview.title,
      welcomeMessage: invite.interview.welcomeMessage,
      allowRetakes: invite.interview.allowRetakes,
      workspaceName: invite.interview.workspace.name,
      careersUrl: invite.interview.workspace.careersUrl,
      accentColor: invite.interview.workspace.accentColor,
      logoUrl,
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
      phase: isShareTemplate
        ? "intro"
        : ((response?.progressPhase as CandidatePhase) ?? "intro"),
      currentQuestionIndex: isShareTemplate
        ? 0
        : (response?.currentQuestionIndex ?? 0),
      retakesUsed,
      uploadedQuestionIds,
    },
    recruiterName: invite.interview.owner.name,
    isPreview: isPreviewInviteEmail(invite.email),
    isShareTemplate,
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
      workspace: {
        name: string;
        careersUrl: string | null;
        accentColor: string;
        logoUrl: string | null;
      };
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
    needsIdentity: false,
    interview: {
      id: invite?.interview.id ?? "",
      title: invite?.interview.title ?? "Interview",
      welcomeMessage: invite?.interview.welcomeMessage ?? null,
      allowRetakes: invite?.interview.allowRetakes ?? true,
      workspaceName: invite?.interview.workspace.name ?? "Company",
      careersUrl: invite?.interview.workspace.careersUrl ?? null,
      accentColor: invite?.interview.workspace.accentColor ?? "#1C6B47",
      logoUrl: invite?.interview.workspace.logoUrl ?? null,
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
    isShareTemplate: false,
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
