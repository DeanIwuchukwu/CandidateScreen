import Link from "next/link";
import { Plus } from "lucide-react";
import { requireSessionUser } from "@/lib/auth/session";
import {
  getDashboardStats,
  getReviewQueue,
  getActiveInterviews,
  getUserWorkspace,
} from "@/lib/recruiter/queries";
import { formatRelativeTime } from "@/lib/recruiter/format";
import {
  candidateStatusPillTone,
  getCandidateDisplayStatus,
} from "@/lib/recruiter/candidate-status";
import { Button } from "@/components/ui/button";
import {
  ResponseProgress,
  StatusPill,
  VideoThumb,
} from "@/components/recruiter/recruiter-ui";

export default async function DashboardPage() {
  const user = await requireSessionUser();
  const { workspace } = await getUserWorkspace(user.id);
  const [stats, queue, active] = await Promise.all([
    getDashboardStats(workspace.id),
    getReviewQueue(workspace.id, 4),
    getActiveInterviews(workspace.id),
  ]);

  const firstName = user.name.split(" ")[0];
  const waiting = stats.responsesWaiting;

  const statCards = [
    {
      label: "New responses",
      value: stats.newResponses,
      sub:
        stats.newSinceYesterday > 0
          ? `↑ ${stats.newSinceYesterday} since yesterday`
          : "No responses yet",
      subClass: stats.newSinceYesterday > 0 ? "text-primary" : "text-faint",
    },
    {
      label: "Awaiting review",
      value: stats.awaitingReview,
      sub:
        stats.activeRoles > 0
          ? `Across ${stats.activeRoles} roles`
          : "No roles in review",
      subClass: "text-faint",
    },
    {
      label: "Completion rate",
      value: `${stats.completionRate}%`,
      sub:
        stats.completionDelta > 0
          ? `↑ ${stats.completionDelta} pts this month`
          : stats.completionRate > 0
            ? "No change this month"
            : "No invites sent yet",
      subClass: stats.completionDelta > 0 ? "text-primary" : "text-faint",
    },
    {
      label: "Active roles",
      value: stats.activeRoles,
      sub:
        stats.closingThisWeek > 0
          ? `${stats.closingThisWeek} closing this week`
          : stats.activeRoles > 0
            ? "No deadlines this week"
            : "Publish an interview to start",
      subClass: "text-faint",
    },
  ];

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline-3 px-8 py-5">
        <div>
          <h1 className="font-display text-[28px] font-medium leading-none">
            Good morning, {firstName}
          </h1>
          <p className="mt-1.5 text-[13px] font-medium text-faint">
            You have {waiting} responses waiting for review
          </p>
        </div>
        <Link href="/app/interviews/new">
          <Button size="sm">
            <Plus size={16} />
            New interview
          </Button>
        </Link>
      </header>

      <div className="flex flex-col gap-[26px] p-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <div key={card.label} className="rounded-[14px] border border-hairline p-5">
              <div className="text-[12.5px] font-semibold text-faint">{card.label}</div>
              <div className="mt-1 font-display text-[34px] leading-tight">{card.value}</div>
              <div className={`mt-0.5 text-xs font-semibold ${card.subClass}`}>{card.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-[22px] lg:grid-cols-[1.55fr_1fr]">
          <section>
            <div className="mb-3.5 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-[0.13em] text-faint-2">
                Needs your review
              </h2>
              <Link href="/app/candidates" className="text-[13px] font-semibold text-primary">
                View all ›
              </Link>
            </div>
            <div className="flex flex-col gap-2.5">
              {queue.map((r, i) => {
                const qCount = r.answers.length || 5;
                const statusLabel = getCandidateDisplayStatus({
                  submittedAt: r.submittedAt,
                  stage: r.stage,
                });
                const tone = candidateStatusPillTone(statusLabel);

                return (
                  <div
                    key={r.id}
                    className="flex items-center gap-3.5 rounded-[12px] border border-hairline px-3.5 py-3"
                  >
                    <VideoThumb variant={i} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-semibold">
                        {r.invite.candidateName ?? "Candidate"}
                      </div>
                      <div className="text-[12.5px] font-medium text-faint">
                        {r.invite.interview.title} · {r.answers.length}/{qCount} answered
                        {r.submittedAt ? ` · ${formatRelativeTime(r.submittedAt)}` : ""}
                      </div>
                    </div>
                    <StatusPill tone={tone}>{statusLabel}</StatusPill>
                    <Link href={`/app/candidates/${r.id}/review`}>
                      <Button variant="secondary" size="sm">
                        Review
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <div className="mb-3.5 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-[0.13em] text-faint-2">
                Active interviews
              </h2>
              <Link href="/app/interviews" className="text-[13px] font-semibold text-primary">
                Manage ›
              </Link>
            </div>
            <div className="flex flex-col gap-2.5">
              {active.map((interview) => (
                  <div key={interview.id} className="rounded-[12px] border border-hairline p-4">
                    <div className="flex items-baseline justify-between">
                      <div className="text-[15px] font-semibold">{interview.title}</div>
                      <span
                        className={`text-xs font-semibold ${interview.newCount > 0 ? "text-primary" : "text-faint"}`}
                      >
                        {interview.newCount} new
                      </span>
                    </div>
                    <div className="mb-2.5 mt-1.5 text-xs font-medium text-faint">
                      {interview.invited} invited · {interview.responded} responded
                    </div>
                    <ResponseProgress responded={interview.responded} invited={interview.invited} />
                  </div>
                ))}
              <Link
                href="/app/interviews/new"
                className="flex items-center justify-center gap-2 rounded-[12px] border border-dashed border-[#DCD5C4] p-4 text-[13px] font-semibold text-primary hover:border-primary"
              >
                <Plus size={15} />
                Create an interview
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
