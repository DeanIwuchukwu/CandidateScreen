import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSessionUser } from "@/lib/auth/session";
import {
  getCandidatesPaginated,
  getCandidateStageCounts,
  getInterview,
  getUserWorkspace,
} from "@/lib/recruiter/queries";
import { getInterviewPipelineStats } from "@/lib/recruiter/pipeline-stats";
import { parsePage } from "@/lib/recruiter/pagination";
import { formatRelativeTime } from "@/lib/recruiter/format";
import {
  candidateStatusPillTone,
  getCandidateDisplayStatus,
} from "@/lib/recruiter/candidate-status";
import { CandidatesPipelineActions } from "@/components/recruiter/candidates-pipeline-actions";
import { CandidateListRow } from "@/components/recruiter/candidate-list-row";
import {
  Breadcrumb,
  CountTabs,
  SearchField,
  SortLabel,
  TableHeader,
  TablePagination,
} from "@/components/recruiter/recruiter-ui";
import type { CandidateStage } from "@prisma/client";

const stages: Array<{ key: CandidateStage | "ALL"; label: string }> = [
  { key: "TO_REVIEW", label: "To review" },
  { key: "SHORTLISTED", label: "Shortlisted" },
  { key: "INTERVIEWING", label: "Interviewing" },
  { key: "PASSED", label: "Passed" },
  { key: "ALL", label: "All" },
];

const TABLE_GRID_SCOPED = "2.4fr 1.1fr 1.3fr 1.2fr 1fr";
const TABLE_GRID_GLOBAL = "2fr 1.5fr 1.1fr 1.2fr 1.1fr 1fr";

type CandidateRow = Awaited<
  ReturnType<typeof getCandidatesPaginated>
>["items"][number] & {
  statusLabel?: string;
  avatar?: { initials: string; color: string };
  durationMin?: number | null;
  reviewed?: boolean;
};

function candidatesUrl(opts: {
  interviewId?: string;
  stage?: string;
  search?: string;
}) {
  const params = new URLSearchParams();
  if (opts.interviewId) params.set("interview", opts.interviewId);
  if (opts.stage) params.set("stage", opts.stage);
  if (opts.search?.trim()) params.set("q", opts.search.trim());
  const q = params.toString();
  return q ? `/app/candidates?${q}` : "/app/candidates";
}

function initialsFromName(name: string | null | undefined) {
  if (!name?.trim()) return "??";
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function rowPresentation(c: CandidateRow) {
  const statusLabel = getCandidateDisplayStatus({
    submittedAt: c.submittedAt,
    stage: c.stage,
  });
  const avatar = c.avatar ?? {
    initials: initialsFromName(c.invite.candidateName),
    color: "#1C6B47",
  };
  const inProgress = statusLabel === "In progress";
  const awaitingDecision = statusLabel === "To review";
  const pillTone = candidateStatusPillTone(statusLabel);
  return { statusLabel, avatar, inProgress, awaitingDecision, pillTone };
}

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{
    interview?: string;
    stage?: string;
    page?: string;
    q?: string;
  }>;
}) {
  const user = await requireSessionUser();
  const { workspace } = await getUserWorkspace(user.id);
  const {
    interview: interviewId,
    stage: stageParam,
    page: pageParam,
    q: searchQuery,
  } = await searchParams;
  const page = parsePage(pageParam);
  const search = searchQuery?.trim() || undefined;
  const scoped = Boolean(interviewId);
  const stage = stageParam ?? (scoped ? "TO_REVIEW" : "ALL");

  const interview = interviewId
    ? await getInterview(workspace.id, interviewId)
    : null;
  if (interviewId && !interview) notFound();

  const [candidatesPage, counts, pipeline] = await Promise.all([
    getCandidatesPaginated(workspace.id, {
      interviewId,
      stage: stage === "ALL" ? undefined : (stage as CandidateStage),
      page,
      search,
    }),
    getCandidateStageCounts(workspace.id, interviewId),
    interviewId
      ? getInterviewPipelineStats(workspace.id, interviewId)
      : Promise.resolve(null),
  ]);

  const rows = candidatesPage.items as CandidateRow[];
  const roleTitle = interview?.title ?? null;
  const invited = pipeline?.invited ?? 0;
  const started = pipeline?.started ?? 0;
  const shareToken = pipeline?.shareToken ?? null;
  const grid = scoped ? TABLE_GRID_SCOPED : TABLE_GRID_GLOBAL;

  if (
    scoped &&
    counts.TO_REVIEW === 0 &&
    stage === "TO_REVIEW" &&
    page === 1
  ) {
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
          {invited > 0 ? (
            <>
              You&apos;ve invited{" "}
              <strong className="text-ink">
                {invited} candidate{invited === 1 ? "" : "s"}
              </strong>
              . Their answers will land here as they record — usually within a day
              or two. We&apos;ll email you when the first one arrives.
            </>
          ) : (
            <>
              Share your invite link or send personal invites. Responses will land
              here as candidates record — we&apos;ll email you when the first one
              arrives.
            </>
          )}
        </p>
        <CandidatesPipelineActions
          interviewId={interviewId!}
          interviewTitle={roleTitle!}
          shareToken={shareToken}
          variant="empty"
        />
        {invited > 0 && (
          <p className="mt-8 text-[13px] font-medium text-faint">
            {invited} invited · {started} started
          </p>
        )}
        <Link
          href="/app/candidates"
          className="mt-6 text-sm font-semibold text-primary hover:underline"
        >
          ← All candidates
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="px-8 pt-[22px]">
        {scoped && roleTitle ? (
          <Breadcrumb
            items={[
              { label: "Candidates", href: "/app/candidates" },
              { label: roleTitle, active: true },
            ]}
          />
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-[28px] font-medium leading-none">
              {scoped && roleTitle ? roleTitle : "Candidates"}
            </h1>
            {!scoped && (
              <p className="mt-2 text-[13px] font-medium text-faint">
                All roles · {counts.ALL} candidate{counts.ALL === 1 ? "" : "s"}
              </p>
            )}
          </div>
          {scoped && interviewId && roleTitle && (
            <div className="flex gap-2.5">
              <a
                href={`/api/candidates/export?${new URLSearchParams({
                  interview: interviewId,
                  ...(stage !== "ALL" ? { stage } : {}),
                  ...(search ? { q: search } : {}),
                }).toString()}`}
                className="inline-flex h-9 items-center justify-center rounded-[9px] border border-[#E0D9C8] bg-surface px-3.5 text-[13px] font-semibold text-ink hover:bg-paper-2"
              >
                Export
              </a>
              <CandidatesPipelineActions
                interviewId={interviewId}
                interviewTitle={roleTitle}
                shareToken={shareToken}
                variant="header"
              />
            </div>
          )}
        </div>

        <CountTabs
          tabs={stages.map((s) => ({
            label: s.label,
            href: candidatesUrl({ interviewId, stage: s.key, search }),
            count: counts[s.key],
            active: stage === s.key,
          }))}
        />
      </div>

      <div className="px-8 pb-7 pt-[18px]">
        <div className="mb-3.5 flex items-center gap-2.5">
          <form className="flex max-w-[280px] flex-1" action="/app/candidates" method="get">
            {interviewId ? (
              <input type="hidden" name="interview" value={interviewId} />
            ) : null}
            {stage ? <input type="hidden" name="stage" value={stage} /> : null}
            <SearchField
              name="q"
              defaultValue={search ?? ""}
              placeholder="Search name"
              className="max-w-none w-full"
            />
          </form>
          <SortLabel>Sorted by · Most recent</SortLabel>
        </div>

        <div className="overflow-hidden rounded-[14px] border border-hairline">
          <TableHeader
            columns={
              scoped
                ? ["Candidate", "Status", "Rating", "Submitted", ""]
                : ["Candidate", "Role", "Status", "Rating", "Submitted", ""]
            }
            gridTemplate={grid}
          />
          {rows.length === 0 ? (
            <div className="px-[22px] py-12 text-center text-sm text-muted">
              No candidates in this stage yet.
            </div>
          ) : (
            rows.map((c) => {
              const { statusLabel, avatar, inProgress, awaitingDecision, pillTone } =
                rowPresentation(c);

              return (
                <CandidateListRow
                  key={c.id}
                  candidate={{
                    id: c.id,
                    name: c.invite.candidateName ?? "Candidate",
                    roleTitle: scoped ? null : c.invite.interview.title,
                    statusLabel,
                    pillTone,
                    inProgress,
                    awaitingDecision,
                    answered: c.answers.length,
                    durationMin: c.durationMin,
                    overallRating: c.overallRating,
                    submittedAtLabel: c.submittedAt
                      ? formatRelativeTime(c.submittedAt)
                      : "—",
                    submitted: Boolean(c.submittedAt),
                    avatar,
                    scoped,
                    grid,
                  }}
                />
              );
            })
          )}
          <TablePagination
            pagination={candidatesPage}
            basePath="/app/candidates"
            query={{
              ...(interviewId ? { interview: interviewId } : {}),
              stage,
              ...(search ? { q: search } : {}),
            }}
          />
        </div>
      </div>
    </>
  );
}
