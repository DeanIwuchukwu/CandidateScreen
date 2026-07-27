import { NextRequest, NextResponse } from "next/server";
import type { CandidateStage } from "@prisma/client";
import { requireSessionUser } from "@/lib/auth/session";
import { getCandidates, getUserWorkspace } from "@/lib/recruiter/queries";
import { getCandidateDisplayStatus } from "@/lib/recruiter/candidate-status";

function csvEscape(value: string) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDate(value: Date | null | undefined) {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  const user = await requireSessionUser();
  const { workspace } = await getUserWorkspace(user.id);
  const { searchParams } = request.nextUrl;

  const interviewId = searchParams.get("interview") ?? undefined;
  const stageParam = searchParams.get("stage");
  const search = searchParams.get("q")?.trim() || undefined;
  const stage =
    stageParam && stageParam !== "ALL"
      ? (stageParam as CandidateStage)
      : undefined;

  const candidates = await getCandidates(workspace.id, {
    interviewId,
    stage,
    search,
  });

  const header = [
    "Name",
    "Email",
    "Role",
    "Stage",
    "Status",
    "Submitted",
    "Updated",
  ];

  const rows = candidates.map((c) => {
    const status = getCandidateDisplayStatus({
      submittedAt: c.submittedAt,
      stage: c.stage,
    });
    return [
      c.invite.candidateName ?? "",
      c.invite.email ?? "",
      c.invite.interview.title,
      c.stage,
      status,
      formatDate(c.submittedAt),
      formatDate(c.updatedAt),
    ].map((cell) => csvEscape(String(cell)));
  });

  const body = [header, ...rows].map((row) => row.join(",")).join("\n");
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = interviewId
    ? `candidates-${interviewId.slice(0, 8)}-${stamp}.csv`
    : `candidates-${stamp}.csv`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
