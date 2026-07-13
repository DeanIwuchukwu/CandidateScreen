"use client";

import { useRef, useState, useTransition } from "react";
import { Check, Clock, MapPin, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitJobApplicationAction } from "@/lib/jobs/actions";
import type { Job } from "@/lib/jobs/types";

function dutyLines(duties: string) {
  return duties
    .split("\n")
    .map((line) => line.replace(/^[•\-]\s*/, "").trim())
    .filter(Boolean);
}

export function PublicJobApplyForm({ job }: { job: Job }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!job.publicSlug) return null;

  if (submitted) {
    return (
      <div className="rounded-[18px] border border-hairline bg-white p-6 text-center shadow-[0_20px_44px_-28px_rgba(20,40,30,0.3)]">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary-tint text-primary">
          <Check size={22} />
        </div>
        <h2 className="mt-4 font-display text-[22px] font-medium">Application received</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Thanks for applying to {job.title}. Our team will review your application and email you if
          you&apos;re invited to a short video interview.
        </p>
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await submitJobApplicationAction(job.publicSlug!, formData);
      if (!result.ok) {
        const messages: Record<string, string> = {
          already_applied: "You've already applied with this email.",
          deadline_passed: "Applications for this role are closed.",
          missing_required: "Please fill in all required fields.",
          not_found: "This job listing is no longer available.",
        };
        setError(messages[result.error] ?? "Could not submit application.");
        return;
      }
      setSubmitted(true);
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="sticky top-5 rounded-[18px] border border-hairline bg-white p-6 shadow-[0_20px_44px_-28px_rgba(20,40,30,0.3)]"
    >
      <h2 className="font-display text-[22px] font-medium leading-tight">Apply for this role</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-muted">
        Takes about 2 minutes — no video needed to apply.
      </p>

      <div className="mt-[18px] flex flex-col gap-3">
        <label className="block text-xs font-semibold text-muted">
          Full name
          <input
            name="name"
            required
            placeholder="Your name"
            className="mt-1.5 w-full rounded-[10px] border border-[#E4DDCD] px-3 py-2.5 text-[13.5px] font-medium"
          />
        </label>
        <label className="block text-xs font-semibold text-muted">
          Email
          <input
            name="email"
            type="email"
            required
            placeholder="you@email.com"
            className="mt-1.5 w-full rounded-[10px] border border-[#E4DDCD] px-3 py-2.5 text-[13.5px] font-medium"
          />
        </label>
        {job.applicationForm.resumeEnabled && (
          <label className="block text-xs font-semibold text-muted">
            Resume / CV
            <div className="relative mt-1.5 flex cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-dashed border-[#D2CBB9] py-3.5 text-[12.5px] font-semibold text-primary">
              <Upload size={15} /> Upload file
              <input
                name="resume"
                type="file"
                accept=".pdf,.doc,.docx"
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </div>
          </label>
        )}
        {job.applicationForm.portfolioEnabled && (
          <label className="block text-xs font-semibold text-muted">
            LinkedIn / portfolio
            <input
              name="portfolioUrl"
              placeholder="https://"
              className="mt-1.5 w-full rounded-[10px] border border-[#E4DDCD] px-3 py-2.5 text-[13.5px] font-medium"
            />
          </label>
        )}
        {job.applicationForm.phoneEnabled && (
          <label className="block text-xs font-semibold text-muted">
            Phone number
            <input
              name="phone"
              placeholder="+1 …"
              className="mt-1.5 w-full rounded-[10px] border border-[#E4DDCD] px-3 py-2.5 text-[13.5px] font-medium"
            />
          </label>
        )}
        {job.applicationForm.customQuestions.map((question, i) => (
          <label key={i} className="block text-xs font-semibold text-muted">
            {question}
            <input
              name={`custom_${i}`}
              className="mt-1.5 w-full rounded-[10px] border border-[#E4DDCD] px-3 py-2.5 text-[13.5px] font-medium"
            />
          </label>
        ))}
      </div>

      {error && (
        <p className="mt-3 text-sm font-medium text-pass" role="alert">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="mt-[18px] h-auto w-full rounded-[12px] py-3.5 text-[15px]"
      >
        Submit application
      </Button>
      <p className="mt-3.5 text-center text-[11.5px] text-faint-2">
        Your details are shared only with the hiring team
      </p>
    </form>
  );
}

export function PublicJobContent({
  job,
  workspaceName,
}: {
  job: Job;
  workspaceName: string;
}) {
  const duties = dutyLines(job.duties);
  const applyBy = job.applicationDeadline
    ? job.applicationDeadline.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-paper">
      <header className="flex items-center justify-between border-b border-hairline-3 bg-surface px-9 py-[18px]">
        <div className="flex items-center gap-2.5">
          <span className="grid h-[30px] w-[30px] place-items-center rounded-[9px] bg-ink text-sm font-bold text-white">
            {workspaceName.charAt(0)}
          </span>
          <div className="leading-tight">
            <div className="text-sm font-semibold">{workspaceName}</div>
            <div className="text-[11.5px] font-medium text-faint">Careers</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-faint">
          <span className="text-primary">●</span>
          Powered by Talang Flow
        </div>
      </header>

      <div className="px-14 pb-[52px] pt-11">
        <div className="mb-3.5 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-tint px-2.5 py-1 text-[11.5px] font-semibold text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Now hiring
          </span>
          <span className="rounded-full border border-[#E0D9C8] px-2.5 py-1 text-xs font-medium text-ink-2">
            {job.department}
          </span>
          <span className="rounded-full border border-[#E0D9C8] px-2.5 py-1 text-xs font-medium text-ink-2">
            {job.employmentType}
          </span>
        </div>

        <h1 className="font-display text-[46px] font-medium leading-[1.05] tracking-[-0.01em]">
          {job.title}
        </h1>

        <div className="mt-3.5 flex flex-wrap items-center gap-[18px] text-sm font-medium text-muted">
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={16} className="text-faint" strokeWidth={1.7} />
            {job.location}
          </span>
          {job.salaryRange && (
            <span className="inline-flex items-center gap-1.5">{job.salaryRange}</span>
          )}
          {applyBy && (
            <span className="inline-flex items-center gap-1.5">
              <Clock size={16} className="text-faint" strokeWidth={1.7} />
              Apply by {applyBy}
            </span>
          )}
        </div>

        <div className="mt-9 grid items-start gap-9 lg:grid-cols-[1fr_340px]">
          <div>
            <div className="relative mb-7 flex aspect-[16/7] items-end overflow-hidden rounded-2xl bg-gradient-to-br from-[#2C8159] via-primary to-[#15523A] p-6">
              <p className="relative max-w-md font-display text-lg italic leading-snug text-[#EFF3EC]">
                &ldquo;Design here means owning the whole problem — from the first interview to the
                shipped flow.&rdquo;
              </p>
            </div>

            <h2 className="font-display text-[23px] font-medium">About the role</h2>
            <p className="mt-2.5 text-[15.5px] leading-relaxed text-ink-2">{job.aboutRole}</p>

            <h2 className="mt-[26px] font-display text-[23px] font-medium">What you&apos;ll do</h2>
            <ul className="mt-2.5 flex flex-col gap-2.5">
              {duties.map((line) => (
                <li key={line} className="flex gap-3 text-[15px] leading-relaxed text-ink-2">
                  <Check size={16} className="mt-0.5 shrink-0 text-primary" strokeWidth={2.2} />
                  {line}
                </li>
              ))}
            </ul>

            <h2 className="mt-[26px] font-display text-[23px] font-medium">
              How hiring works here
            </h2>
            <p className="mt-2.5 text-[15.5px] leading-relaxed text-ink-2">
              First, submit your application below — that&apos;s it for now. Our team reviews every
              application, and if you&apos;re a fit, we&apos;ll invite you by email to record a short
              video interview: five questions, about ten minutes, on your own time.
            </p>
          </div>

          <PublicJobApplyForm job={job} />
        </div>
      </div>

      <footer className="flex items-center justify-between border-t border-hairline-3 bg-surface px-14 py-[22px] text-[12.5px] font-medium text-faint">
        <span>© 2026 {workspaceName} · Careers</span>
        <span>Powered by Talang Flow</span>
      </footer>
    </div>
  );
}
