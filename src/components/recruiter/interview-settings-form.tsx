"use client";

import { useState } from "react";
import { updateInterviewAction } from "@/lib/recruiter/actions";
import { Button } from "@/components/ui/button";
import { SectionLabel, ToggleSwitch } from "@/components/recruiter/recruiter-ui";

type InterviewSettings = {
  id: string;
  title: string;
  welcomeMessage: string | null;
  deadlineDays: number;
  allowRetakes: boolean;
  autoTranscripts: boolean;
  requireIdCheck: boolean;
};

export function InterviewSettingsForm({ interview }: { interview: InterviewSettings }) {
  const [allowRetakes, setAllowRetakes] = useState(interview.allowRetakes);
  const [autoTranscripts, setAutoTranscripts] = useState(interview.autoTranscripts);
  const [requireIdCheck, setRequireIdCheck] = useState(interview.requireIdCheck);

  const updateWithId = updateInterviewAction.bind(null, interview.id);

  return (
    <form action={updateWithId} className="flex flex-col gap-[22px] bg-paper-2 px-[26px] py-[26px]">
      <SectionLabel>Interview settings</SectionLabel>
      <label className="block text-[12.5px] font-semibold text-muted">
        Role
        <input
          name="title"
          defaultValue={interview.title}
          className="mt-1.5 w-full rounded-[10px] border border-[#E4DDCD] bg-white px-3 py-2.5 text-sm font-medium"
        />
      </label>
      <label className="block text-[12.5px] font-semibold text-muted">
        Deadline to respond
        <div className="mt-1.5 flex w-full items-center justify-between rounded-[10px] border border-[#E4DDCD] bg-white px-3 py-2.5 text-sm font-medium">
          {interview.deadlineDays} days after invite
          <span className="text-faint-2">▾</span>
        </div>
        <input type="hidden" name="deadlineDays" value={interview.deadlineDays} />
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
        <div className="flex items-center justify-between text-[13.5px] font-semibold">
          <span>Auto-generate transcripts</span>
          <ToggleSwitch on={autoTranscripts} onChange={setAutoTranscripts} />
          <input type="hidden" name="autoTranscripts" value={autoTranscripts ? "on" : ""} />
        </div>
        <div className="flex items-center justify-between text-[13.5px] font-semibold">
          <span>Require ID check</span>
          <ToggleSwitch on={requireIdCheck} onChange={setRequireIdCheck} />
          <input type="hidden" name="requireIdCheck" value={requireIdCheck ? "on" : ""} />
        </div>
      </div>
      <Button type="submit" variant="secondary" className="w-full">
        Save settings
      </Button>
    </form>
  );
}
