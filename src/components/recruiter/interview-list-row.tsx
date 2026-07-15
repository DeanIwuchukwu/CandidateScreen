"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { deleteInterviewAction } from "@/lib/recruiter/actions";
import { CopyInviteLinkButton } from "@/components/recruiter/copy-invite-link-button";
import { RowActionsMenu } from "@/components/recruiter/row-actions-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatInterviewMeta } from "@/lib/recruiter/format";
import {
  InterviewStatusDot,
  OwnerCell,
  ResponseProgress,
  TABLE_GRID_INTERVIEWS,
} from "@/components/recruiter/recruiter-ui";
import { cn } from "@/lib/utils";

export type InterviewListRowData = {
  id: string;
  title: string;
  status: "ACTIVE" | "DRAFT" | "CLOSED";
  createdAt: string;
  updatedAt: string;
  questionCount: number;
  invited: number;
  responded: number;
  hasCandidateResponses: boolean;
  shareToken: string | null;
  owner: { firstName: string; initials: string; color: string };
};

export function InterviewListRow({ interview }: { interview: InterviewListRowData }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const triggerRef = useRef<HTMLButtonElement>(null);

  const href =
    interview.status === "DRAFT"
      ? `/app/interviews/${interview.id}/build`
      : `/app/candidates?interview=${interview.id}`;

  const mutedTitle = interview.status === "CLOSED";
  const canDelete = !interview.hasCandidateResponses;

  useEffect(() => {
    if (!menuOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  function openDeleteConfirm() {
    if (!canDelete || pending) return;
    setError(null);
    setMenuOpen(false);
    setConfirmOpen(true);
  }

  function confirmDelete() {
    if (pending) return;

    startTransition(async () => {
      const result = await deleteInterviewAction(interview.id);
      if (!result.ok) {
        setError(
          result.error === "has_responses"
            ? "This interview has candidate responses and cannot be deleted."
            : "Interview not found or could not be deleted.",
        );
        return;
      }
      setConfirmOpen(false);
      router.refresh();
    });
  }

  return (
    <div
      className="grid items-center gap-4 border-b border-hairline-2 px-[22px] py-[15px] last:border-0 hover:bg-reviewed"
      style={{ gridTemplateColumns: TABLE_GRID_INTERVIEWS }}
    >
      <Link href={href} className="min-w-0">
        <div
          className={cn(
            "text-[14.5px] font-semibold",
            mutedTitle ? "text-muted" : "text-ink",
          )}
        >
          {interview.title}
        </div>
        <div className="text-xs font-medium text-faint">
          {formatInterviewMeta(
            interview.status,
            new Date(interview.createdAt),
            new Date(interview.updatedAt),
            interview.questionCount,
          )}
        </div>
      </Link>

      <Link href={href}>
        <InterviewStatusDot status={interview.status} />
      </Link>

      <Link href={href}>
        {interview.status === "DRAFT" ? (
          <span className="text-[13px] font-medium text-faint-2">Not published</span>
        ) : (
          <ResponseProgress
            responded={interview.responded}
            invited={interview.invited}
            closed={interview.status === "CLOSED"}
          />
        )}
      </Link>

      <Link href={href}>
        <OwnerCell
          name={interview.owner.firstName}
          initials={interview.owner.initials}
          color={interview.owner.color}
        />
      </Link>

      <div className="flex items-center">
        {interview.shareToken ? (
          <CopyInviteLinkButton token={interview.shareToken} />
        ) : (
          <span className="text-[12px] font-medium text-faint-2">Publish to share</span>
        )}
      </div>

      <div className="relative flex justify-end">
        <button
          ref={triggerRef}
          type="button"
          aria-label={`Actions for ${interview.title}`}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          disabled={pending}
          onClick={() => setMenuOpen((open) => !open)}
          className="rounded-lg px-2 py-1 text-lg font-bold text-faint-2 hover:bg-paper-2 hover:text-ink disabled:opacity-60"
        >
          ⋯
        </button>

        <RowActionsMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          triggerRef={triggerRef}
        >
          <Link
            href={`/app/interviews/${interview.id}/build`}
            role="menuitem"
            onClick={() => setMenuOpen(false)}
            className="block w-full px-3 py-2 text-left text-[13px] font-semibold text-ink hover:bg-paper-2"
          >
            Edit interview
          </Link>
          <button
            type="button"
            role="menuitem"
            disabled={!canDelete || pending}
            title={
              canDelete
                ? undefined
                : "Interviews with candidate responses cannot be deleted"
            }
            onClick={openDeleteConfirm}
            className="w-full px-3 py-2 text-left text-[13px] font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-faint-2 disabled:hover:bg-transparent"
          >
            Delete interview
          </button>
        </RowActionsMenu>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete ${interview.title}?`}
        description="This cannot be undone. The interview and its invites will be removed."
        confirmLabel="Delete interview"
        pending={pending}
        error={error}
        onConfirm={confirmDelete}
        onClose={() => {
          if (!pending) {
            setConfirmOpen(false);
            setError(null);
          }
        }}
      />
    </div>
  );
}
