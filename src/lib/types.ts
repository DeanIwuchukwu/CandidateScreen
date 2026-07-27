export type CandidatePhase =
  | "intro"
  | "identity"
  | "setup"
  | "prep"
  | "recording"
  | "review"
  | "done";

export type InvitePayload = {
  token: string;
  gate: "valid" | "expired" | "completed" | "not_found";
  inviteId: string;
  responseId: string | null;
  candidateName: string | null;
  /** True when this session still needs name + email (e.g. share-link fork). */
  needsIdentity: boolean;
  interview: {
    id: string;
    title: string;
    welcomeMessage: string | null;
    allowRetakes: boolean;
    workspaceName: string;
    careersUrl: string | null;
    accentColor: string;
    logoUrl: string | null;
  };
  questions: Array<{
    id: string;
    order: number;
    text: string;
    timeLimitSec: number;
    retakes: number;
    thinkTimeSec: number;
  }>;
  progress: {
    phase: CandidatePhase;
    currentQuestionIndex: number;
    retakesUsed: Record<string, number>;
    uploadedQuestionIds: string[];
  };
  recruiterName: string;
  isPreview?: boolean;
  /** Public copy-link template — Get started forks a personal session */
  isShareTemplate?: boolean;
};

export const RUBRIC_CRITERIA = [
  "Communication",
  "Craft & rigor",
  "Collaboration",
] as const;
