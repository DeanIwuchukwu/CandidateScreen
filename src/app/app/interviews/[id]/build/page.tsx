import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSessionUser } from "@/lib/auth/session";
import { getInterview, getUserWorkspace } from "@/lib/recruiter/queries";
import {
  addQuestionAction,
  updateInterviewAction,
} from "@/lib/recruiter/actions";
import { QuestionBuilder } from "@/components/recruiter/question-builder";
import { Button } from "@/components/ui/button";
import { PublishButton } from "@/components/recruiter/publish-button";
import { SectionLabel, ToggleSwitch } from "@/components/recruiter/recruiter-ui";

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

  const updateWithId = updateInterviewAction.bind(null, id);
  const addQuestion = addQuestionAction.bind(null, id);
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
          <Button variant="secondary">Preview as candidate</Button>
          <PublishButton interviewId={id} />
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_348px]">
        <div className="border-r border-hairline-3 px-[30px] py-[26px]">
          <div className="mb-4 flex items-center justify-between">
            <SectionLabel>Questions · {interview.questions.length}</SectionLabel>
            <span className="text-[12.5px] font-semibold text-faint">≈ {totalMin} min total</span>
          </div>
          <QuestionBuilder interviewId={id} questions={interview.questions} />
          <form action={addQuestion} className="mt-3">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-[13px] border border-dashed border-[#D2CBB9] py-4 text-[13.5px] font-semibold text-primary hover:border-primary"
            >
              + Add a question
            </button>
          </form>
        </div>

        <form action={updateWithId} className="flex flex-col gap-[22px] bg-paper-2 px-[26px] py-[26px]">
          <SectionLabel>Interview settings</SectionLabel>
          <label className="block text-[12.5px] font-semibold text-muted">
            Role
            <input
              name="title"
              defaultValue={interview.title}
              className="mt-1.5 w-full rounded-[10px] border border-[#E4DDCD] bg-white px-3 py-2.5 text-sm font-medium"
            />
          </label>
          <label className="block text-[12.5px] font-semibold text-muted">
            Deadline to respond
            <div className="mt-1.5 flex w-full items-center justify-between rounded-[10px] border border-[#E4DDCD] bg-white px-3 py-2.5 text-sm font-medium">
              {interview.deadlineDays} days after invite
              <span className="text-faint-2">▾</span>
            </div>
            <input type="hidden" name="deadlineDays" value={interview.deadlineDays} />
          </label>
          <label className="block text-[12.5px] font-semibold text-muted">
            Welcome message
            <textarea
              name="welcomeMessage"
              defaultValue={
                interview.welcomeMessage ??
                "Hi! We loved your application and would love to learn how you think. There are no trick questions — be yourself. — Maya"
              }
              className="mt-1.5 min-h-[74px] w-full rounded-[10px] border border-[#E4DDCD] bg-white px-3 py-2.5 text-[13.5px] leading-relaxed"
              rows={3}
            />
          </label>
          <div className="flex flex-col gap-3.5 border-t border-hairline pt-[18px]">
            <div className="flex items-center justify-between text-[13.5px] font-semibold">
              <span>Allow retakes</span>
              <ToggleSwitch on={interview.allowRetakes} />
              <input type="hidden" name="allowRetakes" value={interview.allowRetakes ? "on" : ""} />
            </div>
            <div className="flex items-center justify-between text-[13.5px] font-semibold">
              <span>Auto-generate transcripts</span>
              <ToggleSwitch on={interview.autoTranscripts} />
              <input type="hidden" name="autoTranscripts" value={interview.autoTranscripts ? "on" : ""} />
            </div>
            <div className="flex items-center justify-between text-[13.5px] font-semibold">
              <span>Require ID check</span>
              <ToggleSwitch on={interview.requireIdCheck} />
              <input type="hidden" name="requireIdCheck" value={interview.requireIdCheck ? "on" : ""} />
            </div>
          </div>
          <Button type="submit" variant="secondary" className="w-full">
            Save settings
          </Button>
        </form>
      </div>
    </>
  );
}
