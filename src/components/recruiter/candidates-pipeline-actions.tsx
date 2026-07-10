"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { inviteCandidateToInterviewAction } from "@/lib/recruiter/actions";
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
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) return null;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await inviteCandidateToInterviewAction(interviewId, formData);
      if (!result.ok) {
        setError(result.error);
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
      <div className="relative w-full max-w-md rounded-[18px] border border-hairline bg-surface p-6 shadow-[0_40px_80px_-30px_rgba(20,40,30,0.55)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-[22px] font-medium">Invite a candidate</h2>
            <p className="mt-2 text-sm text-muted">
              Send a personal invite for <strong className="text-ink-2">{interviewTitle}</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg bg-paper-2 text-faint"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
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
            <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Sending…" : "Send invite"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
