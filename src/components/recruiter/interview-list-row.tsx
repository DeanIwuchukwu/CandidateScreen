"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { deleteInterviewAction } from "@/lib/recruiter/actions";
import { formatInterviewMeta } from "@/lib/recruiter/format";
import {
  InterviewStatusDot,
  OwnerCell,
  ResponseProgress,
  TABLE_GRID_STANDARD,
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
  owner: { firstName: string; initials: string; color: string };
};

export function InterviewListRow({ interview }: { interview: InterviewListRowData }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  const href =
    interview.status === "DRAFT"
      ? `/app/interviews/${interview.id}/build`
      : `/app/candidates?interview=${interview.id}`;

  const mutedTitle = interview.status === "CLOSED";
  const canDelete = !interview.hasCandidateResponses;

  useEffect(() => {
    if (!menuOpen) return;

    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [menuOpen]);

  function handleDelete() {
    if (!canDelete || pending) return;

    const confirmed = window.confirm(
      `Delete "${interview.title}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteInterviewAction(interview.id);
      if (!result.ok) {
        if (result.error === "has_responses") {
          window.alert(
            "This interview has candidate responses and cannot be deleted.",
          );
        } else {
          window.alert("Interview not found or could not be deleted.");
        }
        return;
      }

      setMenuOpen(false);
      router.refresh();
    });
  }

  return (
    <div
      className="grid items-center gap-4 border-b border-hairline-2 px-[22px] py-[15px] last:border-0 hover:bg-reviewed"
      style={{ gridTemplateColumns: TABLE_GRID_STANDARD }}
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

      <div ref={menuRef} className="relative flex justify-end">
        <button
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

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-full z-20 mt-1 min-w-[180px] overflow-hidden rounded-[10px] border border-hairline bg-white py-1 shadow-lg"
          >
            <button
              type="button"
              role="menuitem"
              disabled={!canDelete || pending}
              title={
                canDelete
                  ? undefined
                  : "Interviews with candidate responses cannot be deleted"
              }
              onClick={handleDelete}
              className="w-full px-3 py-2 text-left text-[13px] font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-faint-2 disabled:hover:bg-transparent"
            >
              {pending ? "Deleting…" : "Delete interview"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
