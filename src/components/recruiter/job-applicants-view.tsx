"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Video } from "lucide-react";
import { SendInterviewInviteModal } from "@/components/recruiter/send-interview-invite-modal";
import { CopyLinkChip } from "@/components/recruiter/copy-link-chip";
import { Breadcrumb } from "@/components/recruiter/recruiter-ui";
import { formatCompactRelativeTime } from "@/lib/recruiter/format";
import {
  sendInterviewInvitesAction,
} from "@/lib/jobs/actions";
import type { InterviewInviteOption } from "@/lib/jobs/queries";
import { jobPublicDisplayUrl, jobPublicUrl } from "@/lib/jobs/urls";
import type { ApplicationStage, ApplicationTabCounts, Job, JobApplication } from "@/lib/jobs/types";
import { cn } from "@/lib/utils";

const APPLICANT_GRID = "40px 2.3fr 1fr 1.5fr 1fr 1.6fr";

const stageTabs: ApplicationStage[] = ["APPLIED", "INVITED", "INTERVIEWED", "PASSED"];

function stageLabel(stage: ApplicationStage) {
  return stage.charAt(0) + stage.slice(1).toLowerCase();
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function JobApplicantsView({
  job,
  applications: initialApplications,
  tabCounts,
  interviews,
  initialTab = "APPLIED",
}: {
  job: Job;
  applications: JobApplication[];
  tabCounts: ApplicationTabCounts;
  interviews: InterviewInviteOption[];
  initialTab?: ApplicationStage;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<ApplicationStage>(initialTab);
  const [applications, setApplications] = useState(initialApplications);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteTargets, setInviteTargets] = useState<JobApplication[]>([]);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setApplications(initialApplications);
  }, [initialApplications]);

  const visible = useMemo(() => {
    if (tab === "APPLIED") {
      return applications.filter((a) => a.stage === "APPLIED" || a.stage === "INVITED");
    }
    return applications.filter((a) => a.stage === tab);
  }, [applications, tab]);

  const selectable = visible.filter((a) => a.stage === "APPLIED");

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openInvite(targets: JobApplication[]) {
    setInviteTargets(targets);
    setInviteOpen(true);
  }

  function handleSendInvite(input: {
    applicationIds: string[];
    interviewId: string;
    deadlineDays: number;
    message: string;
  }) {
    return new Promise<{ ok: boolean; error?: string }>((resolve) => {
      startTransition(async () => {
        const result = await sendInterviewInvitesAction(input);
        if (!result.ok) {
          resolve({ ok: false, error: result.error });
          return;
        }
        setSelected(new Set());
        setInviteTargets([]);
        router.refresh();
        resolve({ ok: true });
      });
    });
  }

  const selectedApplicants = selectable.filter((a) => selected.has(a.id));

  return (
    <>
      <div className="px-8 pt-[22px]">
        <Breadcrumb
          items={[
            { label: "Jobs", href: "/app/jobs" },
            { label: job.title, active: true },
          ]}
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-[28px] font-medium leading-none">{job.title}</h1>
            <p className="mt-1.5 text-[13px] font-medium text-faint">
              {tabCounts.Applied + tabCounts.Invited + tabCounts.Interviewed + tabCounts.Passed}{" "}
              applicants · {job.location} · {job.status === "OPEN" ? "Open" : job.status}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            {job.publicSlug && job.status === "OPEN" && (
              <CopyLinkChip
                url={jobPublicUrl(job.publicSlug)}
                label={jobPublicDisplayUrl(job.publicSlug)}
                className="max-w-none bg-white"
              />
            )}
            <Link
              href={`/app/jobs/${job.id}/edit`}
              className="rounded-[10px] border border-[#E4DDCD] px-3.5 py-2 text-[13px] font-semibold hover:bg-paper-2"
            >
              Edit listing
            </Link>
          </div>
        </div>

        <div className="mt-[18px] flex gap-6 border-b border-hairline-3">
          {stageTabs.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setTab(s);
                setSelected(new Set());
              }}
              className={cn(
                "pb-3 text-sm font-semibold",
                tab === s ? "border-b-2 border-primary text-primary" : "text-faint",
              )}
            >
              {stageLabel(s)}{" "}
              <span className={tab === s ? "text-[#9CB6A6]" : "text-[#C9CCC2]"}>
                {tabCounts[stageLabel(s) as keyof ApplicationTabCounts]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {selectedApplicants.length > 0 && tab === "APPLIED" && (
        <div className="mx-8 mt-4 flex items-center justify-between rounded-[11px] border border-[#CDE2D4] bg-primary-tint-2 px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-5 w-5 place-items-center rounded-md bg-primary text-[11px] font-bold text-white">
              ✓
            </span>
            <span className="text-[13.5px] font-semibold text-primary">
              {selectedApplicants.length} applicant{selectedApplicants.length === 1 ? "" : "s"}{" "}
              selected
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-[13px] font-semibold text-muted"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => openInvite(selectedApplicants)}
              className="inline-flex items-center gap-2 rounded-[9px] bg-primary px-4 py-2 text-[13px] font-semibold text-white"
            >
              <Video size={15} /> Send interview invite ({selectedApplicants.length})
            </button>
          </div>
        </div>
      )}

      <div className="px-8 pb-8 pt-4">
        <div className="overflow-hidden rounded-[14px] border border-hairline">
          <div
            className="grid items-center gap-3.5 border-b border-hairline bg-paper-2 px-[18px] py-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-faint-2"
            style={{ gridTemplateColumns: APPLICANT_GRID }}
          >
            <span />
            <span>Applicant</span>
            <span>Applied</span>
            <span>Documents</span>
            <span>Status</span>
            <span />
          </div>

          {visible.map((app) => {
            const isSelected = selected.has(app.id);
            const canSelect = app.stage === "APPLIED";
            const invited = app.stage === "INVITED";

            return (
              <div
                key={app.id}
                className={cn(
                  "grid items-center gap-3.5 border-b border-hairline-2 px-[18px] py-3 last:border-0",
                  (isSelected || invited) && "bg-reviewed",
                )}
                style={{ gridTemplateColumns: APPLICANT_GRID }}
              >
                {canSelect ? (
                  <button
                    type="button"
                    onClick={() => toggleRow(app.id)}
                    className={cn(
                      "grid h-[18px] w-[18px] place-items-center rounded-[5px] border-[1.5px]",
                      isSelected
                        ? "border-primary bg-primary text-[11px] font-bold text-white"
                        : "border-[#C9CCC2]",
                    )}
                    aria-label={`Select ${app.name}`}
                  >
                    {isSelected ? "✓" : null}
                  </button>
                ) : (
                  <span className="h-[18px] w-[18px] rounded-[5px] border border-[#DCD5C4] opacity-60" />
                )}

                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold text-white"
                    style={{ background: app.avatarColor }}
                  >
                    {initials(app.name)}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{app.name}</div>
                    <div className="truncate text-xs font-medium text-faint">{app.email}</div>
                  </div>
                </div>

                <div className="text-[13px] font-medium text-muted">
                  {formatCompactRelativeTime(app.submittedAt)}
                </div>

                <div className="flex flex-wrap gap-2">
                  {app.resumeUrl && (
                    <a
                      href={app.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-[7px] border border-[#E4DDCD] px-2 py-1 text-[11.5px] font-semibold text-muted hover:bg-paper-2"
                    >
                      Resume
                    </a>
                  )}
                  {app.portfolioUrl && (
                    <a
                      href={app.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-[7px] border border-[#E4DDCD] px-2 py-1 text-[11.5px] font-semibold text-muted hover:bg-paper-2"
                    >
                      Portfolio
                    </a>
                  )}
                </div>

                <div>
                  {invited ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-tint px-2.5 py-1 text-[11px] font-semibold text-primary">
                      <Check size={11} strokeWidth={2.4} />
                      Invited
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-[#F1ECE0] px-2.5 py-1 text-[11px] font-semibold text-muted">
                      Applied
                    </span>
                  )}
                </div>

                <div className="flex justify-end">
                  {app.stage === "APPLIED" ? (
                    <button
                      type="button"
                      onClick={() => openInvite([app])}
                      className={cn(
                        "rounded-lg px-3.5 py-2 text-[12.5px] font-semibold",
                        isSelected
                          ? "bg-primary text-white"
                          : "border border-[#E0D9C8] bg-white text-ink",
                      )}
                    >
                      Send interview invite
                    </button>
                  ) : invited && app.inviteSentAt ? (
                    <span className="text-xs font-medium text-faint-2">
                      Sent {formatCompactRelativeTime(app.inviteSentAt)} · awaiting
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <SendInterviewInviteModal
        open={inviteOpen}
        applicants={inviteTargets}
        jobId={job.id}
        jobTitle={job.title}
        interviews={interviews}
        onClose={() => setInviteOpen(false)}
        onSend={handleSendInvite}
      />
    </>
  );
}
