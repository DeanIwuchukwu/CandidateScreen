import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSessionUser } from "@/lib/auth/session";
import { getInterview, getUserWorkspace } from "@/lib/recruiter/queries";
import { QuestionBuilder } from "@/components/recruiter/question-builder";
import { AddQuestionButton } from "@/components/recruiter/add-question-button";
import { InterviewSettingsForm } from "@/components/recruiter/interview-settings-form";
import { PublishButton } from "@/components/recruiter/publish-button";
import { SectionLabel } from "@/components/recruiter/recruiter-ui";

export default async function BuildInterviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireSessionUser();
  const { workspace } = await getUserWorkspace(user.id);
  const interview = await getInterview(workspace.id, id);
  if (!interview) notFound();

  const totalMin = Math.round(
    interview.questions.reduce((s, q) => s + q.timeLimitSec, 0) / 60,
  );

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline-3 px-8 py-5">
        <div>
          <div className="mb-1 text-[13px] font-medium text-faint">Interviews / New</div>
          <h1 className="font-display text-[28px] font-medium leading-none">Build an interview</h1>
        </div>
        <div className="flex gap-2.5">
          <Link
            href="/i/demo"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center justify-center rounded-[9px] border border-[#E0D9C8] bg-surface px-3.5 text-[13px] font-semibold text-ink hover:bg-paper-2"
          >
            Preview as candidate
          </Link>
          <PublishButton interviewId={id} />
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_348px]">
        <div className="border-r border-hairline-3 px-[30px] py-[26px]">
          <div className="mb-4 flex items-center justify-between">
            <SectionLabel>Questions · {interview.questions.length}</SectionLabel>
            <span className="text-[12.5px] font-semibold text-faint">≈ {totalMin} min total</span>
          </div>
          <QuestionBuilder
            key={interview.questions.map((q) => q.id).join("-")}
            interviewId={id}
            questions={interview.questions}
          />
          <div className="mt-3">
            <AddQuestionButton interviewId={id} />
          </div>
        </div>

        <InterviewSettingsForm interview={interview} />
      </div>
    </>
  );
}
