import type { CandidateStage } from "@prisma/client";

export type CandidateDisplayStatus =
  | "In progress"
  | "To review"
  | "Shortlisted"
  | "Interviewing"
  | "Passed";

/** Single status for dashboard + Candidates table — driven by pipeline stage. */
export function getCandidateDisplayStatus(input: {
  submittedAt: Date | string | null | undefined;
  stage: CandidateStage | string;
}): CandidateDisplayStatus {
  if (!input.submittedAt) return "In progress";

  switch (input.stage) {
    case "SHORTLISTED":
      return "Shortlisted";
    case "INTERVIEWING":
      return "Interviewing";
    case "PASSED":
      return "Passed";
    case "TO_REVIEW":
    default:
      return "To review";
  }
}

export function candidateStatusPillTone(
  status: CandidateDisplayStatus,
): "new" | "started" | "reviewed" | "progress" | "muted" {
  switch (status) {
    case "In progress":
      return "progress";
    case "To review":
      return "new";
    case "Shortlisted":
      return "started";
    case "Interviewing":
      return "started";
    case "Passed":
      return "muted";
    default:
      return "muted";
  }
}
