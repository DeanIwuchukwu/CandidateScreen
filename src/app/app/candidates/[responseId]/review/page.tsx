import { notFound } from "next/navigation";
import { requireSessionUser } from "@/lib/auth/session";
import { getCandidateResponse, getUserWorkspace } from "@/lib/recruiter/queries";
import { ReviewPanel } from "@/components/recruiter/review-panel";
import { RUBRIC_CRITERIA } from "@/lib/types";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ responseId: string }>;
}) {
  const { responseId } = await params;
  const user = await requireSessionUser();
  const { workspace } = await getUserWorkspace(user.id);
  const response = await getCandidateResponse(workspace.id, responseId);
  if (!response) notFound();

  const rubric: Record<string, number> = {};
  RUBRIC_CRITERIA.forEach((c) => {
    const r = response.rubricRatings.find((x) => x.criterion === c);
    if (r) rubric[c] = r.rating;
  });

  return (
    <ReviewPanel
      data={{
        id: response.id,
        overallRating: response.overallRating,
        notes: response.notes,
        candidateName: response.invite.candidateName ?? "Candidate",
        interviewTitle: response.invite.interview.title,
        questions: response.invite.interview.questions.map((q) => ({
          id: q.id,
          order: q.order,
          text: q.text,
        })),
        answers: response.answers.map((a) => ({
          questionId: a.questionId,
          videoUrl: a.videoUrl,
          transcript: a.transcript,
        })),
        rubric,
      }}
    />
  );
}
