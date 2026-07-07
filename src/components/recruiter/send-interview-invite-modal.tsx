"use client";

import { useEffect, useState, useTransition } from "react";
import { Send, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { InterviewInviteOption } from "@/lib/jobs/queries";
import type { JobApplication } from "@/lib/jobs/types";

export function SendInterviewInviteModal({
  open,
  applicants,
  jobId,
  jobTitle,
  interviews,
  onClose,
  onSend,
}: {
  open: boolean;
  applicants: JobApplication[];
  jobId: string;
  jobTitle: string;
  interviews: InterviewInviteOption[];
  onClose: () => void;
  onSend: (input: {
    applicationIds: string[];
    interviewId: string;
    deadlineDays: number;
    message: string;
  }) => Promise<{ ok: boolean; error?: string }>;
}) {
  const defaultInterview =
    interviews.find((i) => i.jobId === jobId) ??
    interviews.find((i) => i.title === jobTitle) ??
    interviews[0] ??
    null;

  const [message, setMessage] = useState(
    `Hi [First name] — thanks for applying to the ${jobTitle} role. We'd love to learn how you think. Here's a short video interview you can record whenever suits you. — Maya`,
  );
  const [deadlineDays, setDeadlineDays] = useState(7);
  const [interviewId, setInterviewId] = useState(defaultInterview?.id ?? "");
  const [showInterviewPicker, setShowInterviewPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open && defaultInterview) {
      setInterviewId(defaultInterview.id);
    }
  }, [open, defaultInterview]);

  if (!open || applicants.length === 0) return null;

  const count = applicants.length;
  const names = applicants.map((a) => a.name).join(", ");
  const selectedInterview =
    interviews.find((i) => i.id === interviewId) ?? defaultInterview;

  function handleSend() {
    if (!interviewId) {
      setError("Select an interview to send.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await onSend({
        applicationIds: applicants.map((a) => a.id),
        interviewId,
        deadlineDays,
        message,
      });
      if (!result.ok) {
        setError(result.error ?? "Could not send invites.");
        return;
      }
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(24,33,27,0.34)]"
        aria-label="Close modal"
        onClick={onClose}
      />
      <div className="relative w-full max-w-[560px] overflow-hidden rounded-[20px] bg-surface shadow-[0_40px_80px_-30px_rgba(20,40,30,0.55)]">
        <div className="flex items-start justify-between px-[30px] pt-[26px]">
          <div>
            <h2 className="font-display text-[25px] font-medium leading-tight">
              Send interview invite
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              To <strong className="text-ink-2">{count} selected applicant{count === 1 ? "" : "s"}</strong>.
              They&apos;ll get an email with a private link to record.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-[30px] w-[30px] place-items-center rounded-lg bg-[#F1ECE0] text-faint"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-[30px] pb-1 pt-[22px]">
          <div className="mb-[18px] flex items-center gap-2">
            <div className="flex">
              {applicants.slice(0, 3).map((a, i) => (
                <span
                  key={a.id}
                  className="grid h-[30px] w-[30px] place-items-center rounded-full border-2 border-white text-[11px] font-semibold text-white"
                  style={{
                    background: a.avatarColor,
                    marginLeft: i > 0 ? -9 : 0,
                  }}
                >
                  {a.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
              ))}
            </div>
            <span className="text-[12.5px] font-medium text-muted">{names}</span>
          </div>

          <label className="mb-1.5 block text-[12.5px] font-semibold text-muted">
            Interview to send
          </label>
          {showInterviewPicker ? (
            <div className="mb-3.5 flex flex-col gap-2">
              {interviews.map((interview) => (
                <button
                  key={interview.id}
                  type="button"
                  onClick={() => {
                    setInterviewId(interview.id);
                    setShowInterviewPicker(false);
                  }}
                  className="rounded-[11px] border border-hairline px-3.5 py-3 text-left hover:border-primary"
                >
                  <div className="text-sm font-semibold">{interview.title} interview</div>
                  <div className="text-xs font-medium text-faint">
                    {interview.questionCount} questions · ≈ {interview.totalMin} min ·{" "}
                    {interview.retakes} retakes
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="mb-3.5 flex items-center gap-3 rounded-[11px] border-[1.5px] border-primary bg-[#FCFEFC] p-3.5">
              <span className="grid h-[34px] w-[34px] place-items-center rounded-[9px] bg-primary-tint text-primary">
                <Video size={17} strokeWidth={1.7} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">
                  {selectedInterview?.title ?? jobTitle} interview
                </div>
                <div className="text-xs font-medium text-faint">
                  {selectedInterview
                    ? `${selectedInterview.questionCount} questions · ≈ ${selectedInterview.totalMin} min · ${selectedInterview.retakes} retakes`
                    : "No interviews available"}
                </div>
              </div>
              {interviews.length > 1 && (
                <button
                  type="button"
                  onClick={() => setShowInterviewPicker(true)}
                  className="text-[12.5px] font-semibold text-primary"
                >
                  Change
                </button>
              )}
            </div>
          )}

          <div className="mb-4 grid grid-cols-2 gap-3">
            <label className="block text-[12.5px] font-semibold text-muted">
              Respond within
              <select
                value={deadlineDays}
                onChange={(e) => setDeadlineDays(Number(e.target.value))}
                className="mt-1.5 w-full rounded-[10px] border border-[#E4DDCD] bg-white px-3 py-2.5 text-[13.5px] font-medium"
              >
                {[3, 5, 7, 14].map((d) => (
                  <option key={d} value={d}>
                    {d} days
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[12.5px] font-semibold text-muted">
              From
              <select
                defaultValue="Maya Chen"
                className="mt-1.5 w-full rounded-[10px] border border-[#E4DDCD] bg-white px-3 py-2.5 text-[13.5px] font-medium"
              >
                <option>Maya Chen</option>
              </select>
            </label>
          </div>

          <label className="mb-1.5 block text-[12.5px] font-semibold text-muted">
            Message <span className="font-medium text-faint-2">· editable</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full rounded-[10px] border border-[#E4DDCD] bg-paper-2 px-3.5 py-3 text-[13.5px] leading-relaxed text-ink-2"
          />
          {error && (
            <p className="mt-2 text-sm font-medium text-pass" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-hairline-3 bg-[#FCFAF5] px-[30px] py-[18px]">
          <span className="text-xs font-medium text-faint">
            Applicants move to <strong className="text-ink-2">Invited</strong> once sent
          </span>
          <div className="flex gap-2.5">
            <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={handleSend} disabled={pending || !interviewId}>
              <Send size={15} /> Send {count} invite{count === 1 ? "" : "s"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
