"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Info, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublishJobModal } from "@/components/recruiter/publish-job-modal";
import { SectionLabel, ToggleSwitch } from "@/components/recruiter/recruiter-ui";
import { publishJobAction, saveJobDraftAction } from "@/lib/jobs/actions";
import { jobPublicDisplayUrl } from "@/lib/jobs/urls";
import type { Job, JobApplicationFormConfig } from "@/lib/jobs/types";

const DEPARTMENTS = ["Design", "Engineering", "Customer", "Data", "Marketing", "Product"];
const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Internship"];

export type JobListingFormValues = {
  title: string;
  department: string;
  employmentType: string;
  location: string;
  salaryRange: string;
  aboutRole: string;
  duties: string;
  applicationDeadline: string;
  listOnCareersPage: boolean;
  applicationForm: JobApplicationFormConfig;
};

const defaultForm: JobListingFormValues = {
  title: "Product Designer",
  department: "Design",
  employmentType: "Full-time",
  location: "Remote (EU)",
  salaryRange: "€65k – €85k",
  aboutRole:
    "We're looking for a product designer to own end-to-end design for our onboarding and activation experience. You'll partner closely with engineering and product to ship work that thousands of new users touch every week.",
  duties:
    "Lead design for onboarding flows end to end\nRun lightweight research and turn it into decisions\nPartner with two engineers and a PM",
  applicationDeadline: "2026-07-15",
  listOnCareersPage: true,
  applicationForm: {
    resumeEnabled: true,
    portfolioEnabled: true,
    phoneEnabled: false,
    customQuestions: [],
  },
};

function jobToForm(job: Job): JobListingFormValues {
  return {
    title: job.title,
    department: job.department,
    employmentType: job.employmentType,
    location: job.location,
    salaryRange: job.salaryRange ?? "",
    aboutRole: job.aboutRole,
    duties: job.duties,
    applicationDeadline: job.applicationDeadline
      ? job.applicationDeadline.toISOString().slice(0, 10)
      : "",
    listOnCareersPage: job.listOnCareersPage,
    applicationForm: { ...job.applicationForm },
  };
}

export function JobListingForm({
  job,
  mode = "create",
}: {
  job?: Job;
  mode?: "create" | "edit";
}) {
  const router = useRouter();
  const [values, setValues] = useState<JobListingFormValues>(
    job ? jobToForm(job) : defaultForm,
  );
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function patch<K extends keyof JobListingFormValues>(key: K, value: JobListingFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function patchForm(patchValues: Partial<JobApplicationFormConfig>) {
    setValues((prev) => ({
      ...prev,
      applicationForm: { ...prev.applicationForm, ...patchValues },
    }));
  }

  function addCustomQuestion() {
    patchForm({
      customQuestions: [...values.applicationForm.customQuestions, "Why are you interested in this role?"],
    });
  }

  function removeCustomQuestion(index: number) {
    patchForm({
      customQuestions: values.applicationForm.customQuestions.filter((_, i) => i !== index),
    });
  }

  function handleSaveDraft() {
    setError(null);
    startTransition(async () => {
      const result = await saveJobDraftAction(job?.id ?? null, values);
      if (!result.ok) {
        setError("Could not save draft.");
        return;
      }
      router.push(job?.id ? "/app/jobs" : `/app/jobs/${result.jobId}/edit`);
      router.refresh();
    });
  }

  function handlePublish() {
    setError(null);
    startTransition(async () => {
      const result = await publishJobAction(job?.id ?? null, values);
      if (!result.ok) {
        setError("Could not publish listing.");
        return;
      }
      setPublishedUrl(result.publicUrl);
      setPublishedSlug(result.publicSlug);
      setPublishOpen(true);
      router.refresh();
    });
  }

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline-3 px-8 py-5">
        <div>
          <div className="mb-1 text-[13px] font-medium text-faint">
            Jobs / {mode === "create" ? "New" : "Edit"}
          </div>
          <h1 className="font-display text-[28px] font-medium leading-none">
            {mode === "create" ? "Create a job listing" : "Edit job listing"}
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={pending}
            onClick={handleSaveDraft}
          >
            Save as draft
          </Button>
          <Button type="button" size="sm" disabled={pending} onClick={handlePublish}>
            Publish &amp; get link
          </Button>
        </div>
      </header>

      {error && (
        <p className="px-8 pt-3 text-sm font-medium text-pass" role="alert">
          {error}
        </p>
      )}

      <div className="grid lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-[22px] border-r border-hairline-3 px-8 py-7">
          <label className="block text-[12.5px] font-semibold text-muted">
            Job title
            <input
              value={values.title}
              onChange={(e) => patch("title", e.target.value)}
              className="mt-1.5 w-full rounded-[10px] border border-[#E4DDCD] bg-white px-3.5 py-3 text-[15px] font-medium"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block text-[12.5px] font-semibold text-muted">
              Department
              <select
                value={values.department}
                onChange={(e) => patch("department", e.target.value)}
                className="mt-1.5 w-full rounded-[10px] border border-[#E4DDCD] bg-white px-3.5 py-3 text-sm font-medium"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            <label className="block text-[12.5px] font-semibold text-muted">
              Employment type
              <select
                value={values.employmentType}
                onChange={(e) => patch("employmentType", e.target.value)}
                className="mt-1.5 w-full rounded-[10px] border border-[#E4DDCD] bg-white px-3.5 py-3 text-sm font-medium"
              >
                {EMPLOYMENT_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="block text-[12.5px] font-semibold text-muted">
              Location
              <input
                value={values.location}
                onChange={(e) => patch("location", e.target.value)}
                className="mt-1.5 w-full rounded-[10px] border border-[#E4DDCD] bg-white px-3.5 py-3 text-sm font-medium"
              />
            </label>
            <label className="block text-[12.5px] font-semibold text-muted">
              Salary range{" "}
              <span className="font-medium text-faint-2">· optional</span>
              <input
                value={values.salaryRange}
                onChange={(e) => patch("salaryRange", e.target.value)}
                placeholder="€65k – €85k"
                className="mt-1.5 w-full rounded-[10px] border border-[#E4DDCD] bg-white px-3.5 py-3 text-sm font-medium"
              />
            </label>
          </div>

          <label className="block text-[12.5px] font-semibold text-muted">
            About the role
            <textarea
              value={values.aboutRole}
              onChange={(e) => patch("aboutRole", e.target.value)}
              rows={5}
              className="mt-1.5 w-full rounded-[10px] border border-[#E4DDCD] bg-white px-3.5 py-3 text-sm leading-relaxed text-ink-2"
            />
          </label>

          <label className="block text-[12.5px] font-semibold text-muted">
            What you&apos;ll do
            <textarea
              value={values.duties}
              onChange={(e) => patch("duties", e.target.value)}
              rows={4}
              className="mt-1.5 w-full rounded-[10px] border border-[#E4DDCD] bg-white px-3.5 py-3 text-sm leading-relaxed text-ink-2"
            />
          </label>

          <div className="flex items-start gap-3 rounded-[12px] border border-hairline bg-[#F7F3EA] px-4 py-3.5">
            <Info size={17} className="mt-0.5 shrink-0 text-primary" strokeWidth={1.7} />
            <p className="text-[13px] leading-relaxed text-muted">
              This listing only collects applications. Video interviews are sent separately — you&apos;ll
              review applicants and invite the ones you choose from the{" "}
              <strong className="text-ink-2">Candidates</strong> tab.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-[22px] bg-paper-2 px-[26px] py-7">
          <div>
            <SectionLabel>Application form</SectionLabel>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              Choose what applicants provide when they apply.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {(["Full name", "Email"] as const).map((label) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-[13.5px] font-semibold">{label}</span>
                <span className="rounded-full bg-[#EDE7DA] px-2.5 py-1 text-[11px] font-semibold text-faint">
                  Required
                </span>
              </div>
            ))}
            {(
              [
                ["Resume / CV", "resumeEnabled"],
                ["LinkedIn / portfolio", "portfolioEnabled"],
                ["Phone number", "phoneEnabled"],
              ] as const
            ).map(([label, key]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-[13.5px] font-semibold">{label}</span>
                <ToggleSwitch
                  on={values.applicationForm[key]}
                  onChange={(v) => patchForm({ [key]: v })}
                />
              </div>
            ))}

            {values.applicationForm.customQuestions.map((q, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={q}
                  onChange={(e) => {
                    const next = [...values.applicationForm.customQuestions];
                    next[i] = e.target.value;
                    patchForm({ customQuestions: next });
                  }}
                  className="flex-1 rounded-[10px] border border-[#E4DDCD] bg-white px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeCustomQuestion(i)}
                  className="rounded-lg p-1.5 text-faint hover:bg-white"
                  aria-label="Remove question"
                >
                  <X size={16} />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addCustomQuestion}
              className="mt-1 flex items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-[#D2CBB9] py-2.5 text-[12.5px] font-semibold text-primary hover:border-primary"
            >
              <Plus size={14} /> Add custom question
            </button>
          </div>

          <div className="flex flex-col gap-3 border-t border-hairline pt-[18px]">
            <label className="block text-[12.5px] font-semibold text-muted">
              Application deadline
              <input
                type="date"
                value={values.applicationDeadline}
                onChange={(e) => patch("applicationDeadline", e.target.value)}
                className="mt-1.5 w-full rounded-[10px] border border-[#E4DDCD] bg-white px-3.5 py-2.5 text-sm font-medium"
              />
            </label>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[13.5px] font-semibold">List on careers page</div>
                <div className="text-xs font-medium text-faint">
                  Show publicly, not just via link
                </div>
              </div>
              <ToggleSwitch
                on={values.listOnCareersPage}
                onChange={(v) => patch("listOnCareersPage", v)}
              />
            </div>
          </div>
        </div>
      </div>

      <PublishJobModal
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        publicUrl={publishedUrl ?? ""}
        displayUrl={
          publishedSlug ? jobPublicDisplayUrl(publishedSlug) : ""
        }
        listOnCareersPage={values.listOnCareersPage}
        onDone={() => router.push("/app/jobs")}
      />
    </>
  );
}
