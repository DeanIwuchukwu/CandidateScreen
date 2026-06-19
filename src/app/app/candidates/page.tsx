import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { requireSessionUser } from "@/lib/auth/session";
import {
  getCandidates,
  getCandidateRoles,
  getCandidateStageCounts,
  getInterview,
  getUserWorkspace,
} from "@/lib/recruiter/queries";
import { formatRelativeTime } from "@/lib/recruiter/format";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";
import {
  AvatarCircle,
  Breadcrumb,
  CountTabs,
  FilterButton,
  InterviewStatusDot,
  PageHeader,
  ResponseProgress,
  SearchField,
  SortLabel,
  StatusPill,
  TableHeader,
} from "@/components/recruiter/recruiter-ui";
import type { CandidateStage, InterviewStatus } from "@prisma/client";

const stages: Array<{ key: CandidateStage | "ALL"; label: string }> = [
  { key: "TO_REVIEW", label: "To review" },
  { key: "SHORTLISTED", label: "Shortlisted" },
  { key: "INTERVIEWING", label: "Interviewing" },
  { key: "PASSED", label: "Passed" },
  { key: "ALL", label: "All" },
];

type CandidateRow = Awaited<ReturnType<typeof getCandidates>>[number] & {
  statusLabel?: string;
  avatar?: { initials: string; color: string };
  durationMin?: number | null;
  reviewed?: boolean;
};

function pipelineUrl(interviewId: string, stage?: string) {
  const params = new URLSearchParams({ interview: interviewId });
  if (stage) params.set("stage", stage);
  return `/app/candidates?${params.toString()}`;
}

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ interview?: string; stage?: string }>;
}) {
  const user = await requireSessionUser();
  const { workspace } = await getUserWorkspace(user.id);
  const { interview: interviewId, stage = "TO_REVIEW" } = await searchParams;

  if (!interviewId) {
    return <CandidatesRoleIndex workspaceId={workspace.id} />;
  }

  const interview = await getInterview(workspace.id, interviewId);
  if (!interview) notFound();

  const [candidates, counts] = await Promise.all([
    getCandidates(workspace.id, {
      interviewId,
      stage: stage === "ALL" ? undefined : (stage as CandidateStage),
    }),
    getCandidateStageCounts(workspace.id, interviewId),
  ]);

  const rows = candidates as CandidateRow[];
  const roleTitle = interview.title;
  const invited =
    "_count" in interview && interview._count
      ? (interview._count as { invites: number }).invites
      : 0;

  if (rows.length === 0 && stage === "TO_REVIEW") {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-8 text-center">
        <div className="relative mb-6 grid h-[88px] w-[88px] place-items-center rounded-[22px] bg-paper-2">
          <span className="text-3xl text-primary">▶</span>
          <span className="absolute -right-1.5 -top-1.5 grid h-[26px] w-[26px] place-items-center rounded-full border-[3px] border-white bg-primary text-xs font-bold text-white">
            0
          </span>
        </div>
        <h1 className="font-display text-[27px] font-medium">No responses yet</h1>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">
          You&apos;ve invited{" "}
          <strong className="text-ink">{invited || 15} candidates</strong>. Their answers
          will land here as they record — usually within a day or two. We&apos;ll email you when
          the first one arrives.
        </p>
        <div className="mt-7 flex gap-3">
          <Button>Copy invite link</Button>
          <Button variant="secondary">Invite more</Button>
        </div>
        <Link
          href="/app/candidates"
          className="mt-6 text-sm font-semibold text-primary hover:underline"
        >
          ← All roles
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="px-8 pt-[22px]">
        <Breadcrumb
          items={[
            { label: "Candidates", href: "/app/candidates" },
            { label: roleTitle, active: true },
          ]}
        />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-[28px] font-medium leading-none">{roleTitle}</h1>
          <div className="flex gap-2.5">
            <Button variant="secondary" size="sm">
              Export
            </Button>
            <Button size="sm">
              <Plus size={15} />
              Invite candidates
            </Button>
          </div>
        </div>

        <CountTabs
          tabs={stages.map((s) => ({
            label: s.label,
            href: pipelineUrl(interviewId, s.key),
            count: counts[s.key],
            active: stage === s.key,
          }))}
        />
      </div>

      <div className="px-8 pb-7 pt-[18px]">
        <div className="mb-3.5 flex items-center gap-2.5">
          <SearchField placeholder="Search name" />
          <FilterButton>All sources ▾</FilterButton>
          <FilterButton>Score ▾</FilterButton>
          <SortLabel>Sorted by · Most recent</SortLabel>
        </div>

        <div className="overflow-hidden rounded-[14px] border border-hairline">
          <TableHeader columns={["Candidate", "Status", "Rating", "Submitted", ""]} />
          {rows.map((c) => {
            const qTotal = 5;
            const avatar = c.avatar ?? { initials: "??", color: "#1C6B47" };
            const statusLabel = c.statusLabel ?? "New";
            const pillTone =
              statusLabel === "Reviewed"
                ? "reviewed"
                : statusLabel === "In progress"
                  ? "progress"
                  : statusLabel === "Started"
                    ? "started"
                    : "new";
            const isReviewed = c.reviewed ?? false;
            const inProgress = statusLabel === "In progress";

            return (
              <div
                key={c.id}
                className={`grid items-center gap-4 border-b border-hairline-2 px-5 py-3.5 last:border-0 ${isReviewed ? "bg-[#FCFAF5]" : ""}`}
                style={{ gridTemplateColumns: "2.4fr 1.1fr 1.3fr 1.2fr 0.6fr" }}
              >
                <div className="flex items-center gap-3">
                  <AvatarCircle initials={avatar.initials} color={avatar.color} />
                  <div>
                    <div className="text-sm font-semibold">
                      {c.invite.candidateName ?? "Candidate"}
                    </div>
                    <div className="text-xs font-medium text-faint">
                      {inProgress
                        ? `${c.answers.length}/${qTotal} answered · in progress`
                        : `${qTotal}/${qTotal} answered${c.durationMin ? ` · ${c.durationMin} min` : ""}`}
                    </div>
                  </div>
                </div>
                <StatusPill tone={pillTone}>{statusLabel}</StatusPill>
                <div>
                  {c.overallRating ? (
                    <StarRating value={c.overallRating} readOnly size={15} />
                  ) : (
                    <span className="text-xs font-medium text-[#E4DDCD]">
                      {inProgress ? "—" : "Not rated"}
                    </span>
                  )}
                </div>
                <span className="text-[13px] font-medium text-muted">
                  {c.submittedAt ? formatRelativeTime(c.submittedAt) : "—"}
                </span>
                <div className="text-right">
                  {inProgress ? (
                    <Button variant="secondary" size="sm" disabled className="text-faint-2">
                      Pending
                    </Button>
                  ) : isReviewed ? (
                    <Link href={`/app/candidates/${c.id}/review`}>
                      <Button variant="secondary" size="sm">
                        Open
                      </Button>
                    </Link>
                  ) : (
                    <Link href={`/app/candidates/${c.id}/review`}>
                      <Button size="sm">Review</Button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

async function CandidatesRoleIndex({ workspaceId }: { workspaceId: string }) {
  const roles = await getCandidateRoles(workspaceId);
  const totalToReview = roles.reduce((sum, r) => sum + r.toReview, 0);

  return (
    <>
      <PageHeader
        title="Candidates"
        subtitle={`${roles.length} roles · ${totalToReview} awaiting review`}
      />

      <div className="px-8 pb-7 pt-[18px]">
        <div className="mb-3.5 flex items-center gap-2.5">
          <SearchField placeholder="Search roles" />
          <SortLabel>Sorted by · Most recent</SortLabel>
        </div>

        <div className="overflow-hidden rounded-[14px] border border-hairline">
          <TableHeader
            columns={["Role", "Status", "To review", "Responses", ""]}
          />
          {roles.map((role) => (
            <Link
              key={role.id}
              href={pipelineUrl(role.id)}
              className="grid items-center gap-4 border-b border-hairline-2 px-[22px] py-[15px] last:border-0 hover:bg-reviewed"
              style={{ gridTemplateColumns: "2.2fr 1fr 1fr 1.4fr 0.5fr" }}
            >
              <div>
                <div className="text-[14.5px] font-semibold">{role.title}</div>
                <div className="text-xs font-medium text-faint">
                  {role.responded} responded · {role.invited} invited
                </div>
              </div>
              <InterviewStatusDot status={role.status as InterviewStatus} />
              <span
                className={`text-[13px] font-semibold ${role.toReview > 0 ? "text-primary" : "text-faint"}`}
              >
                {role.toReview > 0 ? role.toReview : "—"}
              </span>
              <ResponseProgress
                responded={role.responded}
                invited={role.invited}
                closed={role.status === "CLOSED"}
              />
              <div className="text-right text-lg font-bold text-faint-2">›</div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
