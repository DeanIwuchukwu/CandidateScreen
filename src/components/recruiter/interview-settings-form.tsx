"use client";

import { useState } from "react";
import { updateInterviewAction } from "@/lib/recruiter/actions";
import { Button } from "@/components/ui/button";
import { InterviewRoleSelector } from "@/components/recruiter/interview-role-selector";
import { SectionLabel, ToggleSwitch } from "@/components/recruiter/recruiter-ui";
import type { JobRoleOption } from "@/lib/jobs/queries";

type InterviewSettings = {
  id: string;
  title: string;
  jobId: string | null;
  welcomeMessage: string | null;
  deadlineDays: number;
  allowRetakes: boolean;
};

const DEADLINE_OPTIONS = [3, 5, 7, 14, 21, 30];

function deadlineOptions(current: number) {
  return DEADLINE_OPTIONS.includes(current)
    ? DEADLINE_OPTIONS
    : [...DEADLINE_OPTIONS, current].sort((a, b) => a - b);
}

export function InterviewSettingsForm({
  interview,
  jobs,
}: {
  interview: InterviewSettings;
  jobs: JobRoleOption[];
}) {
  const [allowRetakes, setAllowRetakes] = useState(interview.allowRetakes);

  const updateWithId = updateInterviewAction.bind(null, interview.id);

  return (
    <form action={updateWithId} className="flex flex-col gap-[22px] bg-paper-2 px-[26px] py-[26px]">
      <SectionLabel>Interview settings</SectionLabel>
      <InterviewRoleSelector
        jobs={jobs}
        defaultJobId={interview.jobId}
        defaultTitle={interview.title}
        showHint={false}
      />
      <label className="block text-[12.5px] font-semibold text-muted">
        Deadline to respond
        <div className="relative mt-1.5">
          <select
            name="deadlineDays"
            defaultValue={interview.deadlineDays}
            className="w-full appearance-none rounded-[10px] border border-[#E4DDCD] bg-white px-3 py-2.5 pr-8 text-sm font-medium"
          >
            {deadlineOptions(interview.deadlineDays).map((days) => (
              <option key={days} value={days}>
                {days} days after invite
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-faint-2">
            ▾
          </span>
        </div>
      </label>
      <label className="block text-[12.5px] font-semibold text-muted">
        Welcome message
        <textarea
          name="welcomeMessage"
          defaultValue={
            interview.welcomeMessage ??
            "Hi! We loved your application and would love to learn how you think. There are no trick questions — be yourself. — Maya"
          }
          className="mt-1.5 min-h-[74px] w-full rounded-[10px] border border-[#E4DDCD] bg-white px-3 py-2.5 text-[13.5px] leading-relaxed"
          rows={3}
        />
      </label>
      <div className="flex flex-col gap-3.5 border-t border-hairline pt-[18px]">
        <div className="flex items-center justify-between text-[13.5px] font-semibold">
          <span>Allow retakes</span>
          <ToggleSwitch on={allowRetakes} onChange={setAllowRetakes} />
          <input type="hidden" name="allowRetakes" value={allowRetakes ? "on" : ""} />
        </div>
      </div>
      <Button type="submit" variant="secondary" className="w-full">
        Save settings
      </Button>
    </form>
  );
}
