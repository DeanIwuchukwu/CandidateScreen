"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useTransition } from "react";
import { saveReviewAction } from "@/lib/recruiter/actions";
import { RUBRIC_CRITERIA } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";
import { AvatarCircle, SectionLabel } from "@/components/recruiter/recruiter-ui";

type ReviewData = {
  id: string;
  overallRating: number | null;
  notes: string | null;
  candidateName: string;
  interviewTitle: string;
  questions: Array<{ id: string; order: number; text: string }>;
  answers: Array<{
    questionId: string;
    videoUrl: string | null;
    transcript: string | null;
    durationSec?: number;
  }>;
  rubric: Record<string, number>;
};

const DEMO_TRANSCRIPT = [
  {
    time: "0:02",
    text: "The project I'm most proud of is a redesign of our onboarding flow. I led design end to end, partnering with two engineers and a PM.",
  },
  {
    time: "0:34",
    text: "We started by interviewing twelve recent sign-ups, and the insight that changed everything was that people abandoned at the workspace step…",
    highlight: true,
  },
  {
    time: "1:06",
    text: "After we shipped it, activation went up nineteen percent in the first month, and support tickets about setup dropped by about a third.",
  },
];

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ReviewPanel({ data }: { data: ReviewData }) {
  const [activeQ, setActiveQ] = useState(1);
  const [overall, setOverall] = useState(data.overallRating ?? 4);
  const [notes, setNotes] = useState(
    data.notes ??
      "Clear storyteller, led with impact. Great example of research → decision. Would want to probe how they handle disagreement in the next round.",
  );
  const [rubric, setRubric] = useState<Record<string, number>>({
    Communication: 5,
    "Craft & rigor": 4,
    Collaboration: 3,
    ...data.rubric,
  });
  const [, startTransition] = useTransition();

  const question = data.questions[activeQ];
  const answer = data.answers.find((a) => a.questionId === question?.id);

  const persist = (extra?: Parameters<typeof saveReviewAction>[1]) => {
    startTransition(() =>
      saveReviewAction(data.id, {
        overallRating: overall,
        notes,
        rubric,
        ...extra,
      }),
    );
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-hairline-3 px-7 py-[18px]">
        <div className="flex items-center gap-3.5">
          <Link
            href="/app/candidates"
            className="grid h-[34px] w-[34px] place-items-center rounded-[9px] border border-[#E4DDCD] bg-white"
          >
            <ChevronLeft size={16} className="text-muted" />
          </Link>
          <AvatarCircle initials={initials(data.candidateName)} />
          <div>
            <h1 className="font-display text-[22px] font-medium leading-none">
              {data.candidateName}
            </h1>
            <p className="mt-1 text-[12.5px] font-medium text-faint">
              {data.interviewTitle} · Applied Jun 16 · {data.answers.length}/
              {data.questions.length} answered
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12.5px] font-semibold text-faint">Candidate 1 of 12</span>
          <div className="flex gap-1.5">
            <button
              type="button"
              className="grid h-[34px] w-[34px] place-items-center rounded-[9px] border border-[#E4DDCD] bg-white"
            >
              <ChevronLeft size={16} className="text-muted" />
            </button>
            <button
              type="button"
              className="grid h-[34px] w-[34px] place-items-center rounded-[9px] border border-[#E4DDCD] bg-white"
            >
              <ChevronRight size={16} className="text-muted" />
            </button>
          </div>
        </div>
      </header>

      <div className="grid flex-1 lg:grid-cols-[1fr_372px]">
        <div className="border-r border-hairline-3 px-7 py-6">
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-gradient-to-br from-[#6E7C6F] via-[#4C574E] to-[#333B35]">
            {answer?.videoUrl ? (
              <video src={answer.videoUrl} controls className="h-full w-full object-cover" />
            ) : (
              <>
                <div className="absolute inset-0 bg-[radial-gradient(46%_42%_at_36%_20%,rgba(255,244,224,.3),transparent_70%)]" />
                <div className="absolute bottom-[-8%] left-1/2 h-[60%] w-[52%] -translate-x-1/2 bg-[radial-gradient(72%_92%_at_50%_22%,#2A352E_60%,transparent_80%)]" />
                <div className="absolute bottom-[34%] left-1/2 aspect-square w-[17%] -translate-x-1/2 rounded-full bg-[radial-gradient(64%_64%_at_42%_34%,#37433A_55%,transparent_78%)]" />
                <div className="absolute inset-0 bg-[rgba(8,12,9,.22)]" />
                <div className="absolute left-1/2 top-1/2 grid h-[62px] w-[62px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/92 shadow-lg">
                  <span className="ml-1 h-0 w-0 border-b-[10px] border-l-[17px] border-t-[10px] border-b-transparent border-l-ink border-t-transparent" />
                </div>
                <div className="absolute left-4 top-3.5 rounded-[7px] bg-black/35 px-2.5 py-1 text-[11px] font-semibold text-white">
                  Question {activeQ + 1} of {data.questions.length}
                </div>
                <div className="absolute bottom-3 left-4 right-4 flex items-center gap-2.5">
                  <span className="text-[11px] font-semibold tabular-nums text-white">0:38</span>
                  <div className="h-1 flex-1 overflow-hidden rounded bg-white/30">
                    <div className="relative h-full w-[40%] rounded bg-white">
                      <span className="absolute -right-1 top-1/2 h-[11px] w-[11px] -translate-y-1/2 rounded-full bg-white" />
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold tabular-nums text-white/60">
                    {answer?.durationSec ? formatDuration(answer.durationSec) : "1:34"}
                  </span>
                  <span className="rounded-md bg-black/35 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                    1.0×
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="mt-[18px]">
            <SectionLabel>Now playing</SectionLabel>
            <p className="mt-1.5 font-display text-[21px] leading-snug">{question?.text}</p>
          </div>

          <div className="mt-[18px] flex flex-wrap gap-2">
            {data.questions.map((q, i) => {
              const dur = data.answers.find((a) => a.questionId === q.id)?.durationSec;
              const active = i === activeQ;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setActiveQ(i)}
                  className={`flex items-center gap-1.5 rounded-[10px] border px-3 py-2 text-[12.5px] font-semibold ${
                    active
                      ? "border-[1.5px] border-primary bg-primary-tint text-primary"
                      : "border-[#E0D9C8] bg-white text-muted"
                  }`}
                >
                  {i < activeQ && <span className="text-[10px] text-primary">✓</span>}
                  {active && <span className="text-[10px]">▶</span>}
                  Q{i + 1}
                  {dur && (
                    <span className={`text-[11px] font-medium ${active ? "text-primary" : "text-faint-2"}`}>
                      {formatDuration(dur)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-[22px] border-t border-hairline-3 pt-[18px]">
            <div className="mb-3 flex items-center justify-between">
              <SectionLabel>Transcript</SectionLabel>
              <button type="button" className="text-xs font-semibold text-primary">
                Auto-generated · Copy
              </button>
            </div>
            <div className="flex flex-col gap-2.5 text-sm leading-relaxed text-[#4A4F45]">
              {(answer?.transcript
                ? [{ time: "0:02", text: answer.transcript }]
                : DEMO_TRANSCRIPT
              ).map((line) => (
                <div key={line.time} className="flex gap-3.5">
                  <span className="shrink-0 pt-0.5 text-xs font-semibold tabular-nums text-[#9CB6A6]">
                    {line.time}
                  </span>
                  <span
                    className={
                      "highlight" in line && line.highlight
                        ? "-mx-1.5 rounded-md bg-[#F7F3EA] px-1.5 py-0.5"
                        : undefined
                    }
                  >
                    {line.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[22px] bg-paper-2 p-6">
          <div className="flex items-center justify-between">
            <SectionLabel>Your scorecard</SectionLabel>
            <span className="text-xs font-medium text-faint">Private</span>
          </div>

          <div className="rounded-[14px] border border-hairline bg-white px-[18px] py-4">
            <div className="text-[13px] font-semibold">Overall impression</div>
            <div className="mt-2.5 flex items-center gap-1.5">
              <StarRating
                value={overall}
                onChange={(v) => {
                  setOverall(v);
                  persist({ overallRating: v });
                }}
                size={26}
              />
              <span className="ml-1.5 text-sm font-semibold text-primary">
                {overall >= 4 ? "Strong" : overall >= 3 ? "Good" : "—"}
              </span>
            </div>
          </div>

          <div>
            <SectionLabel>By criteria</SectionLabel>
            <div className="mt-3.5 flex flex-col gap-3.5">
              {RUBRIC_CRITERIA.map((criterion) => (
                <div key={criterion} className="flex items-center justify-between">
                  <span className="text-[13.5px] font-semibold">{criterion}</span>
                  <StarRating
                    value={rubric[criterion] ?? 0}
                    onChange={(v) => {
                      const next = { ...rubric, [criterion]: v };
                      setRubric(next);
                      persist({ rubric: next });
                    }}
                    size={18}
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionLabel>Notes</SectionLabel>
            <textarea
              className="mt-2 min-h-[78px] w-full rounded-xl border border-[#E4DDCD] bg-white px-3.5 py-3 text-[13.5px] leading-relaxed"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => persist()}
            />
          </div>

          <div className="mt-auto flex flex-col gap-2">
            <Button
              className="w-full"
              onClick={() => persist({ decision: "ADVANCE", stage: "SHORTLISTED" })}
            >
              Advance to next round
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => persist({ decision: "MAYBE" })}>
                Maybe
              </Button>
              <Button
                variant="danger"
                onClick={() => persist({ decision: "PASS", stage: "PASSED" })}
              >
                Pass
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
