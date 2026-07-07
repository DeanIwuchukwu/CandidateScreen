"use client";

import { createInterviewAction } from "@/lib/recruiter/actions";
import { InterviewRoleSelector } from "@/components/recruiter/interview-role-selector";
import type { JobRoleOption } from "@/lib/jobs/queries";

export function CreateInterviewForm({ jobs }: { jobs: JobRoleOption[] }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <form action={createInterviewAction} className="w-full max-w-md space-y-5">
        <div>
          <h1 className="font-display text-2xl font-medium">Create an interview</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Choose a listed job or enter a custom role for interviews that aren&apos;t tied to a job
            posting.
          </p>
        </div>

        <InterviewRoleSelector jobs={jobs} defaultTitle="" />

        <button
          type="submit"
          className="w-full rounded-[10px] bg-primary py-3 text-sm font-semibold text-white hover:bg-[#185a3c]"
        >
          Continue to builder
        </button>
      </form>
    </div>
  );
}
