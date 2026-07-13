"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import {
  inviteCandidateToInterviewAction,
  inviteCandidatesBulkToInterviewAction,
} from "@/lib/recruiter/actions";
import { CopyInviteLinkButton } from "@/components/recruiter/copy-invite-link-button";
import { Button } from "@/components/ui/button";

export function CandidatesPipelineActions({
  interviewId,
  interviewTitle,
  shareToken,
  variant = "empty",
}: {
  interviewId: string;
  interviewTitle: string;
  shareToken: string | null;
  variant?: "empty" | "header";
}) {
  const [inviteOpen, setInviteOpen] = useState(false);

  if (variant === "header") {
    return (
      <>
        {shareToken && <CopyInviteLinkButton token={shareToken} />}
        <Button size="sm" type="button" onClick={() => setInviteOpen(true)}>
          <Plus size={15} />
          Invite candidates
        </Button>
        <InviteCandidateModal
          open={inviteOpen}
          interviewId={interviewId}
          interviewTitle={interviewTitle}
          onClose={() => setInviteOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        {shareToken ? (
          <CopyInviteLinkButton token={shareToken} />
        ) : (
          <Button disabled>Copy invite link</Button>
        )}
        <Button variant="secondary" type="button" onClick={() => setInviteOpen(true)}>
          Invite more
        </Button>
      </div>
      <InviteCandidateModal
        open={inviteOpen}
        interviewId={interviewId}
        interviewTitle={interviewTitle}
        onClose={() => setInviteOpen(false)}
      />
    </>
  );
}

function parseBulkCandidates(raw: string) {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      // Name, email@domain.com
      const comma = line.match(/^(.+?),\s*(\S+@\S+)$/);
      if (comma) return { name: comma[1]!.trim(), email: comma[2]!.trim() };

      // Name <email@domain.com>
      const angle = line.match(/^(.+?)\s*<(\S+@\S+)>$/);
      if (angle) return { name: angle[1]!.trim(), email: angle[2]!.trim() };

      // email only
      if (line.includes("@") && !line.includes(" ")) {
        return { name: line.split("@")[0] || "Candidate", email: line };
      }

      return null;
    })
    .filter((row): row is { name: string; email: string } => Boolean(row));
}

function InviteCandidateModal({
  open,
  interviewId,
  interviewTitle,
  onClose,
}: {
  open: boolean;
  interviewId: string;
  interviewTitle: string;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [bulkText, setBulkText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) return null;

  function handleClose() {
    setError(null);
    setSuccess(null);
    setBulkText("");
    setMode("single");
    onClose();
  }

  function handleSingleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await inviteCandidateToInterviewAction(interviewId, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      handleClose();
    });
  }

  function handleBulkSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const candidates = parseBulkCandidates(bulkText);
    if (candidates.length === 0) {
      setError("Paste one candidate per line: Name, email@company.com");
      return;
    }

    startTransition(async () => {
      const result = await inviteCandidatesBulkToInterviewAction(interviewId, candidates);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.sent === 0 && result.failed.length > 0) {
        setError(
          result.failed
            .slice(0, 3)
            .map((f) => `${f.email}: ${f.error}`)
            .join(" · "),
        );
        return;
      }
      const failNote =
        result.failed.length > 0 ? ` (${result.failed.length} skipped)` : "";
      setSuccess(`Sent ${result.sent} invite${result.sent === 1 ? "" : "s"}${failNote}.`);
      setBulkText("");
      if (result.failed.length === 0) {
        window.setTimeout(() => handleClose(), 900);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(24,33,27,0.34)]"
        aria-label="Close modal"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-lg rounded-[18px] border border-hairline bg-surface p-6 shadow-[0_40px_80px_-30px_rgba(20,40,30,0.55)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-[22px] font-medium">Invite candidates</h2>
            <p className="mt-2 text-sm text-muted">
              Personal invites for <strong className="text-ink-2">{interviewTitle}</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="grid h-8 w-8 place-items-center rounded-lg bg-paper-2 text-faint"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 flex gap-1 rounded-[10px] bg-paper-2 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("single");
              setError(null);
              setSuccess(null);
            }}
            className={`flex-1 rounded-[8px] px-3 py-2 text-[13px] font-semibold ${
              mode === "single" ? "bg-white text-ink shadow-sm" : "text-muted"
            }`}
          >
            Single
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("bulk");
              setError(null);
              setSuccess(null);
            }}
            className={`flex-1 rounded-[8px] px-3 py-2 text-[13px] font-semibold ${
              mode === "bulk" ? "bg-white text-ink shadow-sm" : "text-muted"
            }`}
          >
            Bulk
          </button>
        </div>

        {mode === "single" ? (
          <form onSubmit={handleSingleSubmit} className="mt-5 space-y-4">
            <label className="block text-[12.5px] font-semibold text-muted">
              Name
              <input
                name="name"
                required
                className="mt-1.5 w-full rounded-[10px] border border-[#E4DDCD] px-3 py-2.5 text-sm font-medium"
                placeholder="Jordan Reyes"
              />
            </label>
            <label className="block text-[12.5px] font-semibold text-muted">
              Email
              <input
                name="email"
                type="email"
                required
                className="mt-1.5 w-full rounded-[10px] border border-[#E4DDCD] px-3 py-2.5 text-sm font-medium"
                placeholder="jordan@email.com"
              />
            </label>
            {error && (
              <p className="text-sm font-medium text-pass" role="alert">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2.5 pt-1">
              <Button type="button" variant="secondary" size="sm" onClick={handleClose} disabled={pending}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? "Sending…" : "Send invite"}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleBulkSubmit} className="mt-5 space-y-4">
            <label className="block text-[12.5px] font-semibold text-muted">
              Candidates (one per line)
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                rows={8}
                required
                className="mt-1.5 w-full rounded-[10px] border border-[#E4DDCD] px-3 py-2.5 font-mono text-[13px] font-medium"
                placeholder={"Jordan Reyes, jordan@email.com\nAlex Lee, alex@email.com\nsam@email.com"}
              />
            </label>
            <p className="text-[12px] text-faint">
              Formats: <code className="text-ink-2">Name, email</code>,{" "}
              <code className="text-ink-2">Name &lt;email&gt;</code>, or email alone.
            </p>
            {error && (
              <p className="text-sm font-medium text-pass" role="alert">
                {error}
              </p>
            )}
            {success && (
              <p className="text-sm font-medium text-primary" role="status">
                {success}
              </p>
            )}
            <div className="flex justify-end gap-2.5 pt-1">
              <Button type="button" variant="secondary" size="sm" onClick={handleClose} disabled={pending}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? "Sending…" : "Send invites"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
