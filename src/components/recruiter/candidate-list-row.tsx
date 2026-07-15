"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type MouseEvent } from "react";
import { removeCandidateAction } from "@/lib/recruiter/actions";
import { RowActionsMenu } from "@/components/recruiter/row-actions-menu";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";
import {
  AvatarCircle,
  StatusPill,
} from "@/components/recruiter/recruiter-ui";

export type CandidateListRowData = {
  id: string;
  name: string;
  roleTitle: string | null;
  statusLabel: string;
  pillTone: "new" | "started" | "reviewed" | "progress" | "muted";
  inProgress: boolean;
  awaitingDecision: boolean;
  answered: number;
  durationMin: number | null | undefined;
  overallRating: number | null;
  submittedAtLabel: string;
  submitted: boolean;
  avatar: { initials: string; color: string };
  scoped: boolean;
  grid: string;
};

export function CandidateListRow({ candidate }: { candidate: CandidateListRowData }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const reviewHref = `/app/candidates/${candidate.id}/review`;

  useEffect(() => {
    if (!menuOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  function handleRemove(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (pending) return;

    const name = candidate.name;
    const confirmed = window.confirm(
      candidate.submitted
        ? `Remove "${name}"? Their recording, scores, and notes will be permanently deleted.`
        : `Remove "${name}"? They will disappear from Candidates and this invite link will stop working.`,
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await removeCandidateAction(candidate.id);
      if (!result.ok) {
        window.alert(
          result.error === "forbidden"
            ? "This candidate cannot be removed."
            : "Candidate not found or could not be removed.",
        );
        return;
      }
      setMenuOpen(false);
      router.refresh();
    });
  }

  return (
    <div
      className={`grid items-center gap-4 border-b border-hairline-2 px-[22px] py-3.5 last:border-0 hover:bg-reviewed ${!candidate.awaitingDecision && !candidate.inProgress ? "bg-[#FCFAF5]" : ""}`}
      style={{ gridTemplateColumns: candidate.grid }}
    >
      <Link href={reviewHref} className="flex min-w-0 items-center gap-3">
        <AvatarCircle
          initials={candidate.avatar.initials}
          color={candidate.avatar.color}
        />
        <div className="min-w-0">
          <div className="text-sm font-semibold">{candidate.name}</div>
          <div className="text-xs font-medium text-faint">
            {candidate.inProgress
              ? `${candidate.answered} answered · in progress`
              : `${candidate.answered} answered${candidate.durationMin ? ` · ${candidate.durationMin} min` : ""}`}
          </div>
        </div>
      </Link>

      {!candidate.scoped && (
        <Link href={reviewHref} className="min-w-0">
          <div className="truncate text-[13px] font-semibold">
            {candidate.roleTitle}
          </div>
        </Link>
      )}

      <Link href={reviewHref}>
        <StatusPill tone={candidate.pillTone}>{candidate.statusLabel}</StatusPill>
      </Link>

      <Link href={reviewHref}>
        {candidate.overallRating ? (
          <StarRating value={candidate.overallRating} readOnly size={15} />
        ) : (
          <span className="text-xs font-medium text-[#E4DDCD]">
            {candidate.inProgress ? "—" : "Not rated"}
          </span>
        )}
      </Link>

      <Link href={reviewHref} className="text-[13px] font-medium text-muted">
        {candidate.submittedAtLabel}
      </Link>

      <div className="relative flex items-center justify-end gap-1">
        <Link href={reviewHref}>
          <Button
            variant={candidate.awaitingDecision ? "primary" : "secondary"}
            size="sm"
            tabIndex={-1}
          >
            {candidate.awaitingDecision ? "Review" : "Open"}
          </Button>
        </Link>

        <button
          ref={triggerRef}
          type="button"
          aria-label={`Actions for ${candidate.name}`}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          disabled={pending}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setMenuOpen((open) => !open);
          }}
          className="rounded-lg px-2 py-1 text-lg font-bold text-faint-2 hover:bg-paper-2 hover:text-ink disabled:opacity-60"
        >
          ⋯
        </button>

        <RowActionsMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          triggerRef={triggerRef}
        >
          <button
            type="button"
            role="menuitem"
            disabled={pending}
            onClick={handleRemove}
            className="w-full px-3 py-2 text-left text-[13px] font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-faint-2 disabled:hover:bg-transparent"
          >
            {pending ? "Removing…" : "Remove candidate"}
          </button>
        </RowActionsMenu>
      </div>
    </div>
  );
}
