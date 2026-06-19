import { prisma } from "@/lib/db";
import type { CandidateStage, InterviewStatus } from "@prisma/client";
import { isDevBypass } from "@/lib/dev/bypass";
import {
  MOCK_USER,
  MOCK_WORKSPACE_MEMBERS,
  mockActiveInterviews,
  mockAnalytics,
  mockCandidateResponse,
  mockCandidateRoles,
  mockCandidateStageCounts,
  mockCandidates,
  mockDashboardStats,
  mockInterviewsList,
  mockReviewQueue,
  MOCK_INTERVIEW,
  MOCK_DRAFT_INTERVIEW,
} from "@/lib/dev/mock-data";

export async function getUserWorkspace(userId: string) {
  if (isDevBypass()) {
    return {
      id: MOCK_USER.memberships[0]!.id,
      workspaceId: "dev-workspace",
      userId,
      role: "ADMIN" as const,
      createdAt: new Date(),
      workspace: MOCK_USER.memberships[0]!.workspace,
    };
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
    include: { workspace: true },
  });
  if (!membership) throw new Error("No workspace");
  return membership;
}

export async function getWorkspaceMembers(workspaceId: string) {
  if (isDevBypass()) return MOCK_WORKSPACE_MEMBERS;

  return prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: { user: true },
  });
}

export async function getDashboardStats(workspaceId: string) {
  if (isDevBypass()) return mockDashboardStats();

  const [newResponses, awaitingReview, invites, completed] = await Promise.all([
    prisma.candidateResponse.count({
      where: {
        submittedAt: { gte: new Date(Date.now() - 86400000) },
        invite: { interview: { workspaceId } },
      },
    }),
    prisma.candidateResponse.count({
      where: {
        stage: "TO_REVIEW",
        submittedAt: { not: null },
        invite: { interview: { workspaceId } },
      },
    }),
    prisma.invite.count({ where: { interview: { workspaceId } } }),
    prisma.invite.count({ where: { interview: { workspaceId }, status: "COMPLETED" } }),
  ]);

  const activeRoles = await prisma.interview.count({
    where: { workspaceId, status: "ACTIVE" },
  });

  return {
    newResponses,
    awaitingReview,
    completionRate: invites > 0 ? Math.round((completed / invites) * 100) : 0,
    activeRoles,
  };
}

export async function getReviewQueue(workspaceId: string, limit = 5) {
  if (isDevBypass()) return mockReviewQueue().slice(0, limit);

  return prisma.candidateResponse.findMany({
    where: {
      submittedAt: { not: null },
      stage: "TO_REVIEW",
      invite: { interview: { workspaceId } },
    },
    include: {
      invite: { include: { interview: true } },
      answers: true,
    },
    orderBy: { submittedAt: "desc" },
    take: limit,
  });
}

export async function getActiveInterviews(workspaceId: string) {
  if (isDevBypass()) return mockActiveInterviews();

  return prisma.interview.findMany({
    where: { workspaceId, status: "ACTIVE" },
    include: {
      _count: { select: { invites: true } },
      invites: { where: { status: "COMPLETED" }, select: { id: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getInterviews(workspaceId: string, status?: InterviewStatus) {
  if (isDevBypass()) return mockInterviewsList(status);

  return prisma.interview.findMany({
    where: {
      workspaceId,
      ...(status ? { status } : {}),
    },
    include: {
      owner: true,
      questions: true,
      _count: { select: { invites: true } },
      invites: { where: { status: "COMPLETED" }, select: { id: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getInterview(workspaceId: string, interviewId: string) {
  if (isDevBypass()) {
    const found = mockInterviewsList().find((i) => i.id === interviewId);
    if (found) return found;
    if (interviewId === "demo-draft") return MOCK_DRAFT_INTERVIEW;
    return MOCK_INTERVIEW;
  }

  return prisma.interview.findFirst({
    where: { id: interviewId, workspaceId },
    include: {
      questions: { orderBy: { order: "asc" } },
      owner: true,
      workspace: true,
    },
  });
}

export async function getCandidateRoles(workspaceId: string) {
  if (isDevBypass()) return mockCandidateRoles();

  const interviews = await prisma.interview.findMany({
    where: { workspaceId, status: { in: ["ACTIVE", "CLOSED"] } },
    include: {
      _count: { select: { invites: true } },
      invites: {
        where: { status: "COMPLETED" },
        select: { id: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const roles = await Promise.all(
    interviews.map(async (interview) => {
      const toReview = await prisma.candidateResponse.count({
        where: {
          stage: "TO_REVIEW",
          invite: { interviewId: interview.id },
        },
      });
      return {
        id: interview.id,
        title: interview.title,
        status: interview.status,
        invited: interview._count.invites,
        responded: interview.invites.length,
        toReview,
      };
    }),
  );

  return roles;
}

export async function getCandidateStageCounts(
  workspaceId: string,
  interviewId?: string,
) {
  if (isDevBypass()) return mockCandidateStageCounts(interviewId);
  // Production: aggregate counts per stage
  const stages = ["TO_REVIEW", "SHORTLISTED", "INTERVIEWING", "PASSED"] as const;
  const counts = await Promise.all(
    stages.map((stage) =>
      prisma.candidateResponse.count({
        where: {
          stage,
          invite: {
            interview: {
              workspaceId,
              ...(interviewId ? { id: interviewId } : {}),
            },
          },
        },
      }),
    ),
  );
  const all = counts.reduce((a, b) => a + b, 0);
  return {
    TO_REVIEW: counts[0]!,
    SHORTLISTED: counts[1]!,
    INTERVIEWING: counts[2]!,
    PASSED: counts[3]!,
    ALL: all,
  };
}

export async function getCandidates(
  workspaceId: string,
  opts: { stage?: CandidateStage; interviewId?: string } = {},
) {
  if (isDevBypass()) return mockCandidates(opts.stage, opts.interviewId);

  return prisma.candidateResponse.findMany({
    where: {
      ...(opts.stage ? { stage: opts.stage } : {}),
      invite: {
        interview: {
          workspaceId,
          ...(opts.interviewId ? { id: opts.interviewId } : {}),
        },
      },
    },
    include: {
      invite: { include: { interview: true } },
      answers: true,
      rubricRatings: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getCandidateResponse(workspaceId: string, responseId: string) {
  if (isDevBypass()) return mockCandidateResponse(responseId);

  return prisma.candidateResponse.findFirst({
    where: {
      id: responseId,
      invite: { interview: { workspaceId } },
    },
    include: {
      invite: { include: { interview: { include: { questions: { orderBy: { order: "asc" } } } } } },
      answers: { include: { question: true } },
      rubricRatings: true,
    },
  });
}

export async function getAnalytics(workspaceId: string) {
  if (isDevBypass()) return mockAnalytics();

  const invites = await prisma.invite.findMany({
    where: { interview: { workspaceId } },
    include: { response: true, interview: true },
  });

  const total = invites.length;
  const started = invites.filter((i) => i.status !== "PENDING").length;
  const completed = invites.filter((i) => i.status === "COMPLETED").length;
  const reviewed = await prisma.candidateResponse.count({
    where: {
      decision: { not: null },
      invite: { interview: { workspaceId } },
    },
  });
  const advanced = await prisma.candidateResponse.count({
    where: {
      decision: "ADVANCE",
      invite: { interview: { workspaceId } },
    },
  });

  const funnel = [
    { label: "Invited", count: total, pct: 100 },
    { label: "Started", count: started, pct: total ? Math.round((started / total) * 100) : 0 },
    { label: "Completed", count: completed, pct: total ? Math.round((completed / total) * 100) : 0 },
    { label: "Reviewed", count: reviewed, pct: total ? Math.round((reviewed / total) * 100) : 0 },
    { label: "Advanced", count: advanced, pct: total ? Math.round((advanced / total) * 100) : 0 },
  ];

  const byRole = await prisma.interview.findMany({
    where: { workspaceId },
    include: {
      invites: true,
      _count: { select: { invites: true } },
    },
  });

  const roleStats = byRole.map((r) => {
    const invited = r.invites.length;
    const done = r.invites.filter((i) => i.status === "COMPLETED").length;
    return {
      title: r.title,
      invited,
      completion: invited ? Math.round((done / invited) * 100) : 0,
      avgScore: 3.8,
    };
  });

  const completionTrend = [
    { week: "W1", rate: 72 },
    { week: "W2", rate: 78 },
    { week: "W3", rate: 81 },
    { week: "W4", rate: 79 },
    { week: "W5", rate: 84 },
    { week: "W6", rate: 86 },
    { week: "W7", rate: 85 },
    { week: "W8", rate: 88 },
  ];

  const dropOff = [100, 92, 85, 78, 72].map((v, i) => ({
    question: `Q${i + 1}`,
    rate: v,
  }));

  return {
    kpis: {
      invites: total,
      completion: total ? Math.round((completed / total) * 100) : 0,
      medianDays: 1.4,
      avgScore: 3.8,
    },
    funnel,
    roleStats,
    completionTrend,
    dropOff,
  };
}
