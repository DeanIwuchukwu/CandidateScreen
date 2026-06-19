export type CandidatePhase =
  | "intro"
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
  interview: {
    id: string;
    title: string;
    welcomeMessage: string | null;
    allowRetakes: boolean;
    workspaceName: string;
    careersUrl: string | null;
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
};

export const RUBRIC_CRITERIA = [
  "Communication",
  "Craft & rigor",
  "Collaboration",
] as const;

export function mockTranscript(questionText: string) {
  return `[Auto transcript] Candidate response to: "${questionText.slice(0, 80)}…" — transcript processing complete.`;
}
