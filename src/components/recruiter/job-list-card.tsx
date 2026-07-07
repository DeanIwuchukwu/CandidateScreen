import Link from "next/link";
import { formatJobMeta } from "@/lib/recruiter/format";
import { jobPublicDisplayUrl } from "@/lib/jobs/urls";
import type { Job } from "@/lib/jobs/types";
import { CopyLinkChip } from "@/components/recruiter/copy-link-chip";
import { JobStatusPill, jobTitleMuted } from "@/components/recruiter/job-status-pill";
import { cn } from "@/lib/utils";

export function JobListCard({
  job,
  applicantCount,
}: {
  job: Job;
  applicantCount: number;
}) {
  const manageHref =
    job.status === "DRAFT" ? `/app/jobs/${job.id}/edit` : `/app/jobs/${job.id}`;
  const manageLabel = job.status === "DRAFT" ? "Edit" : "Manage";

  return (
    <div className="flex items-center gap-5 rounded-[14px] border border-hairline px-5 py-[18px]">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "text-base font-semibold",
              jobTitleMuted(job.status) && "text-muted",
            )}
          >
            {job.title}
          </span>
          <JobStatusPill status={job.status} />
        </div>
        <p className="mt-1 text-[12.5px] font-medium text-faint">{formatJobMeta(job)}</p>
      </div>

      {job.status === "OPEN" && job.publicSlug ? (
        <CopyLinkChip
          url={jobPublicDisplayUrl(job.publicSlug)}
          label={jobPublicDisplayUrl(job.publicSlug)}
        />
      ) : job.status === "DRAFT" ? (
        <p className="max-w-[300px] flex-1 text-[12.5px] font-medium text-faint-2">
          Link generated once published
        </p>
      ) : (
        <p className="max-w-[300px] flex-1 text-[12.5px] font-medium text-faint-2">
          Applications closed
        </p>
      )}

      <div className="min-w-[78px] text-center">
        <div
          className={cn(
            "font-display text-[22px] leading-none",
            job.status === "DRAFT" && "text-faint-2",
          )}
        >
          {job.status === "DRAFT" ? "—" : applicantCount}
        </div>
        <div className="text-[11px] font-medium text-faint">applicants</div>
      </div>

      <Link
        href={manageHref}
        className="shrink-0 rounded-[9px] border border-[#E0D9C8] px-[15px] py-2 text-[13px] font-semibold text-ink hover:bg-paper-2"
      >
        {manageLabel}
      </Link>
    </div>
  );
}
