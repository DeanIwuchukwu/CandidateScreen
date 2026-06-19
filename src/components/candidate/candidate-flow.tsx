"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { AlertCircle, Check, Clock, Mail } from "lucide-react";
import type { InvitePayload, CandidatePhase } from "@/lib/types";
import {
  saveCandidateProgress,
  startCandidateSession,
  submitCandidateInterview,
  uploadCandidateAnswer,
} from "@/lib/candidate/actions";
import {
  formatTime,
  useAudioLevel,
  useCountdown,
  useMediaDevices,
  useMediaRecorder,
  useMediaStream,
} from "@/hooks/use-recorder";
import { VideoPreview, RecordedPlayback } from "@/components/candidate/video-preview";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Props = { data: InvitePayload };

export function CandidateFlow({ data }: Props) {
  if (data.gate === "expired") return <ExpiredScreen data={data} />;
  if (data.gate === "completed") return <AlreadySubmittedScreen data={data} />;
  if (data.gate === "not_found") return <NotFoundScreen />;

  return <CandidateFlowInner data={data} />;
}

function CandidateFlowInner({ data }: Props) {
  const [phase, setPhase] = useState<CandidatePhase>(data.progress.phase);
  const [qIndex, setQIndex] = useState(data.progress.currentQuestionIndex);
  const [retakesUsed, setRetakesUsed] = useState(data.progress.retakesUsed);
  const [uploading, setUploading] = useState(false);
  const [localBlob, setLocalBlob] = useState<Blob | null>(null);

  const question = data.questions[qIndex];
  const retakesLeft = question
    ? Math.max(0, question.retakes - (retakesUsed[question.id] ?? 0))
    : 0;

  const { cameras, mics, cameraId, micId, setCameraId, setMicId, refresh } = useMediaDevices();
  const needsStream = phase === "setup" || phase === "prep" || phase === "recording";
  const { stream, error: permError } = useMediaStream(cameraId, micId, needsStream);
  const levels = useAudioLevel(stream);
  const { blob, elapsed, recording, start, stop, reset } = useMediaRecorder(stream);

  const persist = useCallback(
    async (nextPhase: CandidatePhase, nextIndex: number) => {
      setPhase(nextPhase);
      setQIndex(nextIndex);
      await saveCandidateProgress(data.token, nextPhase, nextIndex);
    },
    [data.token],
  );

  const onPrepDone = useCallback(() => persist("recording", qIndex), [persist, qIndex]);

  const thinkTime = question?.thinkTimeSec || 3;
  const countdown = useCountdown(thinkTime, phase === "prep", onPrepDone);

  const timeLimit = question?.timeLimitSec ?? 120;
  const remaining = Math.max(0, timeLimit - elapsed);

  if (permError === "denied" && phase !== "intro") {
    return <CameraBlockedScreen onRetry={() => refresh()} />;
  }

  if (phase === "recording" && recording && remaining === 0) {
    stop();
    persist("review", qIndex);
  }

  const handleStartSession = async () => {
    await startCandidateSession(data.token);
    await persist("setup", 0);
  };

  const handleSetupContinue = async () => {
    if (question.thinkTimeSec > 0) await persist("prep", qIndex);
    else await persist("recording", qIndex);
  };

  const handleStartRecording = () => {
    reset();
    start();
  };

  const handleStopRecording = () => {
    stop();
    setTimeout(() => persist("review", qIndex), 100);
  };

  const handleUseAnswer = async () => {
    const videoBlob = blob ?? localBlob;
    if (!videoBlob || !question) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("video", videoBlob, "answer.webm");
    fd.append("durationSec", String(elapsed || 1));
    await uploadCandidateAnswer(data.token, question.id, fd);
    setLocalBlob(null);
    setUploading(false);

    if (qIndex >= data.questions.length - 1) {
      await submitCandidateInterview(data.token);
      await persist("done", qIndex);
    } else {
      const next = qIndex + 1;
      const nextQ = data.questions[next];
      await persist(nextQ.thinkTimeSec > 0 ? "prep" : "recording", next);
    }
  };

  const handleReRecord = async () => {
    if (retakesLeft <= 0) return;
    setRetakesUsed((r) => ({ ...r, [question.id]: (r[question.id] ?? 0) + 1 }));
    reset();
    setLocalBlob(null);
    if (question.thinkTimeSec > 0) await persist("prep", qIndex);
    else await persist("recording", qIndex);
  };

  const header = (
    <header className="flex items-center justify-between border-b border-hairline-3 bg-surface px-6 py-4 md:px-8">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-primary" />
        <span className="text-[15px] font-semibold tracking-tight">Candidate Screen</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-faint">Invited by</span>
        <span className="font-semibold">{data.interview.workspaceName}</span>
      </div>
    </header>
  );

  if (phase === "intro") {
    return (
      <div className="min-h-screen bg-paper">
        {header}
        <div className="mx-auto grid max-w-5xl gap-10 px-6 py-12 md:grid-cols-2 md:px-10">
          <div>
            <p className="text-sm font-semibold text-primary">
              Video interview · {data.interview.title}
            </p>
            <h1 className="mt-4 font-display text-4xl font-medium leading-tight md:text-5xl">
              Tell {data.interview.workspaceName} a little more about you.
            </h1>
            <p className="mt-4 text-muted">
              There&apos;s no live interviewer and no trick questions — just {data.questions.length}{" "}
              short prompts you can answer whenever you&apos;re ready.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge>≈ {data.questions.length * 2} minutes</Badge>
              <Badge>{data.questions.length} questions</Badge>
              <Badge>Record anytime</Badge>
              {data.interview.allowRetakes && <Badge>Retakes allowed</Badge>}
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button size="lg" className="rounded-full" onClick={handleStartSession}>
                Get started →
              </Button>
            </div>
            {data.interview.welcomeMessage && (
              <div className="mt-8 flex gap-3 rounded-[14px] border border-hairline bg-[#F7F3EA] p-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-white">
                  {data.recruiterName.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <div className="text-sm font-semibold">{data.recruiterName}</div>
                  <p className="mt-1 font-display text-base italic leading-relaxed text-ink-2">
                    &ldquo;{data.interview.welcomeMessage}&rdquo;
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="rounded-[14px] border border-hairline bg-panel p-8">
            <VideoPreview stream={null} className="aspect-video w-full rounded-[14px]" />
            <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-faint-2">
              What to expect
            </p>
            <ol className="mt-4 space-y-4 text-sm">
              {["Check your setup", "Get ready for each question", "Record your answers"].map(
                (step, i) => (
                  <li key={step} className="flex gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[#E0D9C8] bg-white text-xs font-semibold text-primary">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ),
              )}
            </ol>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "setup") {
    return (
      <div className="min-h-screen bg-paper">
        {header}
        <div className="mx-auto grid max-w-5xl gap-8 px-6 py-10 md:grid-cols-2">
          <div>
            <VideoPreview stream={stream} className="aspect-[4/3] w-full rounded-[16px]" />
            <div className="mt-4 flex items-end gap-1">
              {levels.map((h, i) => (
                <div
                  key={i}
                  className="w-2 rounded-full bg-primary transition-all"
                  style={{ height: `${12 + h * 40}px` }}
                />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-medium">Check your setup</h2>
            <label className="block text-sm">
              <span className="font-semibold text-muted">Camera</span>
              <select
                className="mt-1 w-full rounded-[10px] border border-[#E4DDCD] px-3 py-2.5 text-sm"
                value={cameraId}
                onChange={(e) => setCameraId(e.target.value)}
              >
                {cameras.map((c) => (
                  <option key={c.deviceId} value={c.deviceId}>
                    {c.label || "Camera"}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-semibold text-muted">Microphone</span>
              <select
                className="mt-1 w-full rounded-[10px] border border-[#E4DDCD] px-3 py-2.5 text-sm"
                value={micId}
                onChange={(e) => setMicId(e.target.value)}
              >
                {mics.map((m) => (
                  <option key={m.deviceId} value={m.deviceId}>
                    {m.label || "Microphone"}
                  </option>
                ))}
              </select>
            </label>
            <ul className="space-y-2 text-sm text-muted">
              <li className="flex items-center gap-2">
                <Check size={16} className="text-primary" /> Camera detected
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="text-primary" /> Microphone detected
              </li>
            </ul>
            <Button className="w-full" onClick={handleSetupContinue} disabled={!stream}>
              Everything looks good — Continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "prep" && question) {
    const pct = thinkTime > 0 ? ((thinkTime - countdown) / thinkTime) * 100 : 100;
    return (
      <div className="min-h-screen bg-paper">
        {header}
        <div className="mx-auto max-w-3xl px-6 py-12 text-center">
          <p className="text-sm font-semibold text-faint">
            Question {qIndex + 1} of {data.questions.length}
          </p>
          <h2 className="mt-4 font-display text-3xl font-medium leading-snug md:text-4xl">
            {question.text}
          </h2>
          <div className="mx-auto mt-10 grid h-40 w-40 place-items-center rounded-full bg-conic-gradient from-primary to-primary-tint">
            <div className="grid h-32 w-32 place-items-center rounded-full bg-paper">
              <div className="text-3xl font-display">{countdown}</div>
              <div className="text-xs text-faint">Recording starts shortly</div>
            </div>
          </div>
          <div className="mt-8 flex justify-center gap-3">
            <Button onClick={() => persist("recording", qIndex)}>Start recording now</Button>
            <Button variant="ghost" onClick={() => persist("recording", qIndex)}>
              Skip the countdown
            </Button>
          </div>
          <div
            className="pointer-events-none fixed inset-0 -z-10 opacity-10"
            style={{
              background: `conic-gradient(#1C6B47 ${pct}%, transparent ${pct}%)`,
            }}
          />
        </div>
      </div>
    );
  }

  if (phase === "recording" && question) {
    return (
      <div className="flex min-h-screen flex-col bg-[#1a211c] text-white">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-record" />
            <span className="text-xs font-bold tracking-wide">REC</span>
            <span className="text-xs font-semibold">{formatTime(elapsed)}</span>
          </div>
          <span className="text-sm text-white/70">
            Question {qIndex + 1} of {data.questions.length}
          </span>
        </div>
        <div className="relative flex-1">
          <VideoPreview stream={stream} className="absolute inset-0 h-full w-full" mirrored={false} />
          <div className="absolute bottom-24 left-1/2 max-w-lg -translate-x-1/2 rounded-full bg-black/40 px-5 py-2 text-center font-display text-sm backdrop-blur-sm">
            {question.text}
          </div>
          <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-full border border-white/10 bg-black/50 px-5 py-3 backdrop-blur-md">
            <Button
              className="rounded-full bg-record hover:bg-record-dark"
              onClick={handleStopRecording}
            >
              Stop & review
            </Button>
            <span className="text-sm tabular-nums">{formatTime(remaining)} left</span>
          </div>
        </div>
        {!recording && (
          <div className="absolute inset-0 grid place-items-center bg-black/60">
            <Button size="lg" onClick={handleStartRecording}>
              Start recording
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (phase === "review" && question) {
    const playback = blob ?? localBlob;
    return (
      <div className="min-h-screen bg-paper">
        {header}
        <div className="mx-auto grid max-w-5xl gap-8 px-6 py-10 md:grid-cols-2">
          <RecordedPlayback blob={playback} className="aspect-video w-full rounded-[14px] bg-black" />
          <div className="rounded-[14px] bg-paper-2 p-6">
            <h2 className="font-display text-2xl font-medium">Happy with this take?</h2>
            <p className="mt-2 text-sm text-muted">Question {qIndex + 1}: {question.text}</p>
            <Button className="mt-6 w-full" onClick={handleUseAnswer} disabled={!playback || uploading}>
              {uploading ? "Uploading…" : "Use this answer →"}
            </Button>
            {data.interview.allowRetakes && (
              <Button
                variant="secondary"
                className="mt-3 w-full"
                onClick={handleReRecord}
                disabled={retakesLeft <= 0}
              >
                Re-record ({retakesLeft} left)
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    return <DoneScreen data={data} questionCount={data.questions.length} />;
  }

  return null;
}

function DoneScreen({ data, questionCount }: { data: InvitePayload; questionCount: number }) {
  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary-tint text-primary">
          <Check size={28} />
        </div>
        <h1 className="mt-6 font-display text-4xl font-medium">
          That&apos;s a wrap{data.candidateName ? `, ${data.candidateName.split(" ")[0]}` : ""}.
        </h1>
        <div className="mt-6 flex justify-center gap-6 text-sm">
          <span>{questionCount}/{questionCount} answered</span>
          <span>Submitted</span>
        </div>
        {data.interview.careersUrl && (
          <Link href={data.interview.careersUrl} className="mt-8 inline-block">
            <Button variant="secondary">Back to {data.interview.workspaceName} careers</Button>
          </Link>
        )}
      </div>
    </div>
  );
}

function CameraBlockedScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-[14px] bg-[#FBEAE7] text-record">
          <AlertCircle size={28} />
        </div>
        <h1 className="mt-6 font-display text-3xl font-medium">We can&apos;t see or hear you yet</h1>
        <ol className="mt-6 space-y-3 text-left text-sm text-muted">
          <li>1. Click the camera icon in your browser&apos;s address bar</li>
          <li>2. Allow access to your camera and microphone</li>
          <li>3. Refresh and try again</li>
        </ol>
        <Button className="mt-8" onClick={onRetry}>
          Try again
        </Button>
      </div>
    </div>
  );
}

function ExpiredScreen({ data }: Props) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="max-w-md text-center">
        <Clock size={40} className="mx-auto text-warn" />
        <h1 className="mt-6 font-display text-3xl font-medium">This interview link has expired</h1>
        <p className="mt-3 text-muted">{data.interview.title} · {data.interview.workspaceName}</p>
        <Button variant="secondary" className="mt-8">
          <Mail size={16} /> Email the recruiter
        </Button>
      </div>
    </div>
  );
}

function AlreadySubmittedScreen({ data }: Props) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-tint text-primary">
          <Check size={28} />
        </div>
        <h1 className="mt-6 font-display text-3xl font-medium">
          You&apos;ve already completed this interview
        </h1>
        {data.interview.careersUrl && (
          <Link href={data.interview.careersUrl} className="mt-8 inline-block">
            <Button variant="secondary">Back to careers</Button>
          </Link>
        )}
      </div>
    </div>
  );
}

function NotFoundScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="text-center">
        <h1 className="font-display text-3xl font-medium">Interview not found</h1>
        <p className="mt-3 text-muted">This link may be invalid or has been removed.</p>
      </div>
    </div>
  );
}
