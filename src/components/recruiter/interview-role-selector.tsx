"use client";

import { useMemo, useState } from "react";
import type { JobRoleOption } from "@/lib/jobs/queries";
import { cn } from "@/lib/utils";

const CUSTOM_VALUE = "custom";

export type InterviewRoleSelectorProps = {
  jobs: JobRoleOption[];
  defaultJobId?: string | null;
  defaultTitle: string;
  /** Label above the control */
  label?: string;
  /** Show helper text under the role field */
  showHint?: boolean;
};

export function InterviewRoleSelector({
  jobs,
  defaultJobId,
  defaultTitle,
  label = "Role",
  showHint = true,
}: InterviewRoleSelectorProps) {
  const initialListed = defaultJobId && jobs.some((j) => j.id === defaultJobId);
  const [mode, setMode] = useState<"listed" | "custom">(
    initialListed ? "listed" : defaultJobId ? "custom" : jobs.length > 0 ? "listed" : "custom",
  );
  const [selectedJobId, setSelectedJobId] = useState(
    initialListed ? defaultJobId! : jobs[0]?.id ?? "",
  );
  const [customTitle, setCustomTitle] = useState(
    initialListed ? "" : defaultTitle,
  );

  const selectedJob = useMemo(
    () => jobs.find((j) => j.id === selectedJobId),
    [jobs, selectedJobId],
  );

  const resolvedTitle =
    mode === "listed" && selectedJob ? selectedJob.title : customTitle.trim();

  function onSelectChange(value: string) {
    if (value === CUSTOM_VALUE) {
      setMode("custom");
      if (!customTitle && selectedJob) setCustomTitle(selectedJob.title);
      return;
    }
    setMode("listed");
    setSelectedJobId(value);
  }

  const selectValue = mode === "custom" ? CUSTOM_VALUE : selectedJobId;

  return (
    <div className="space-y-2">
      <label className="block text-[12.5px] font-semibold text-muted">
        {label}
        <select
          value={selectValue}
          onChange={(e) => onSelectChange(e.target.value)}
          className="mt-1.5 w-full rounded-[10px] border border-[#E4DDCD] bg-white px-3 py-2.5 text-sm font-medium"
        >
          {jobs.length > 0 ? (
            <>
              <optgroup label="Listed jobs">
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title} — {job.department} · {job.statusLabel}
                  </option>
                ))}
              </optgroup>
              <option value={CUSTOM_VALUE}>Custom role (not listed)</option>
            </>
          ) : (
            <option value={CUSTOM_VALUE}>Custom role (not listed)</option>
          )}
        </select>
      </label>

      {mode === "custom" && (
        <label className="block text-[12.5px] font-semibold text-muted">
          Role title
          <input
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            required
            placeholder="e.g. Senior Product Designer"
            className="mt-1.5 w-full rounded-[10px] border border-[#E4DDCD] bg-white px-3 py-2.5 text-sm font-medium"
          />
        </label>
      )}

      {mode === "listed" && selectedJob && (
        <p className="text-[12.5px] font-medium text-faint">
          Interview title: <span className="text-muted">{selectedJob.title}</span>
          {selectedJob.status === "OPEN" && selectedJob.publicSlug && (
            <span className="text-faint-2"> · linked to job listing</span>
          )}
        </p>
      )}

      {showHint && mode === "custom" && (
        <p className="text-[12.5px] leading-relaxed text-faint">
          Use a custom role when you want a video interview that isn&apos;t tied to a published job
          listing.
        </p>
      )}

      <input type="hidden" name="roleMode" value={mode} />
      <input type="hidden" name="jobId" value={mode === "listed" ? selectedJobId : ""} />
      <input type="hidden" name="title" value={resolvedTitle} />
    </div>
  );
}

export function InterviewRoleSelectorReadonly({
  jobId,
  title,
  jobs,
}: {
  jobId?: string | null;
  title: string;
  jobs: JobRoleOption[];
}) {
  const job = jobId ? jobs.find((j) => j.id === jobId) : null;
  return (
    <p className={cn("text-sm font-medium", job ? "text-muted" : "text-ink")}>
      {title}
      {job && (
        <span className="ml-1.5 text-[12px] font-semibold text-primary">
          · Listed job
        </span>
      )}
    </p>
  );
}
