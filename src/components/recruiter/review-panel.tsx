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
  queueIds: string[];
  queueIndex: number;
};

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

function firstAnsweredIndex(data: ReviewData) {
  const idx = data.questions.findIndex((q) =>
    data.answers.some((a) => a.questionId === q.id && a.videoUrl),
  );
  return idx >= 0 ? idx : 0;
}

export function ReviewPanel({ data }: { data: ReviewData }) {
  const [activeQ, setActiveQ] = useState(() => firstAnsweredIndex(data));
  const [overall, setOverall] = useState(data.overallRating ?? 0);
  const [notes, setNotes] = useState(data.notes ?? "");
  const [rubric, setRubric] = useState<Record<string, number>>({ ...data.rubric });
  const [, startTransition] = useTransition();

  const question = data.questions[activeQ];
  const answer = data.answers.find((a) => a.questionId === question?.id);
  const hasVideo = Boolean(answer?.videoUrl);
  const hasTranscript = Boolean(answer?.transcript?.trim());

  const queueTotal = data.queueIds.length;
  const canPrev = data.queueIndex > 0;
  const canNext = data.queueIndex < queueTotal - 1;
  const prevId = canPrev ? data.queueIds[data.queueIndex - 1] : null;
  const nextId = canNext ? data.queueIds[data.queueIndex + 1] : null;

  const copyTranscript = async () => {
    if (!answer?.transcript) return;
    try {
      await navigator.clipboard.writeText(answer.transcript);
    } catch {
      /* clipboard unavailable */
    }
  };

  const persist = (extra?: Parameters<typeof saveReviewAction>[1]) => {
    startTransition(() =>
      saveReviewAction(data.id, {
        overallRating: overall || undefined,
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
          <span className="text-[12.5px] font-semibold text-faint">
            Candidate {queueTotal > 0 ? data.queueIndex + 1 : 1} of {queueTotal || 1}
          </span>
          <div className="flex gap-1.5">
            {prevId ? (
              <Link
                href={`/app/candidates/${prevId}/review`}
                className="grid h-[34px] w-[34px] place-items-center rounded-[9px] border border-[#E4DDCD] bg-white"
              >
                <ChevronLeft size={16} className="text-muted" />
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="grid h-[34px] w-[34px] place-items-center rounded-[9px] border border-[#E4DDCD] bg-white opacity-40"
              >
                <ChevronLeft size={16} className="text-muted" />
              </button>
            )}
            {nextId ? (
              <Link
                href={`/app/candidates/${nextId}/review`}
                className="grid h-[34px] w-[34px] place-items-center rounded-[9px] border border-[#E4DDCD] bg-white"
              >
                <ChevronRight size={16} className="text-muted" />
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="grid h-[34px] w-[34px] place-items-center rounded-[9px] border border-[#E4DDCD] bg-white opacity-40"
              >
                <ChevronRight size={16} className="text-muted" />
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="grid flex-1 lg:grid-cols-[1fr_372px]">
        <div className="border-r border-hairline-3 px-7 py-6">
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-gradient-to-br from-[#6E7C6F] via-[#4C574E] to-[#333B35]">
            {hasVideo ? (
              <video src={answer!.videoUrl!} controls className="h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 grid place-items-center px-6 text-center">
                <div>
                  <p className="text-sm font-semibold text-white/90">
                    No recording for this question
                  </p>
                  <p className="mt-1.5 text-[13px] text-white/60">
                    {data.answers.length === 0
                      ? "This candidate hasn’t uploaded any answers yet."
                      : "They may still be in progress, or skipped this question."}
                  </p>
                </div>
              </div>
            )}
            <div className="absolute left-4 top-3.5 rounded-[7px] bg-black/35 px-2.5 py-1 text-[11px] font-semibold text-white">
              Question {activeQ + 1} of {data.questions.length}
            </div>
            {hasVideo && answer?.durationSec ? (
              <div className="absolute bottom-3 left-4 rounded-md bg-black/35 px-2 py-1 text-[11px] font-semibold tabular-nums text-white">
                {formatDuration(answer.durationSec)}
              </div>
            ) : null}
          </div>

          <div className="mt-[18px]">
            <SectionLabel>Now playing</SectionLabel>
            <p className="mt-1.5 font-display text-[21px] leading-snug">{question?.text}</p>
          </div>

          <div className="mt-[18px] flex flex-wrap gap-2">
            {data.questions.map((q, i) => {
              const answered = data.answers.find((a) => a.questionId === q.id);
              const dur = answered?.durationSec;
              const active = i === activeQ;
              const done = Boolean(answered?.videoUrl);
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
                  {done && !active && <span className="text-[10px] text-primary">✓</span>}
                  {active && <span className="text-[10px]">▶</span>}
                  Q{i + 1}
                  {dur ? (
                    <span className={`text-[11px] font-medium ${active ? "text-primary" : "text-faint-2"}`}>
                      {formatDuration(dur)}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="mt-[22px] border-t border-hairline-3 pt-[18px]">
            <div className="mb-3 flex items-center justify-between">
              <SectionLabel>Transcript</SectionLabel>
              {hasTranscript ? (
                <button
                  type="button"
                  onClick={() => copyTranscript()}
                  className="text-xs font-semibold text-primary"
                >
                  Auto-generated · Copy
                </button>
              ) : null}
            </div>
            {hasTranscript ? (
              <div className="flex flex-col gap-2.5 text-sm leading-relaxed text-[#4A4F45]">
                <div className="flex gap-3.5">
                  <span className="shrink-0 pt-0.5 text-xs font-semibold tabular-nums text-[#9CB6A6]">
                    —
                  </span>
                  <span>{answer!.transcript}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-faint">
                No transcript for this question yet.
              </p>
            )}
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
