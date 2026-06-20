"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { AlertCircle, Check, Clock } from "lucide-react";
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
import { CandidateFlowHeader } from "@/components/candidate/candidate-flow-chrome";
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

  const handleRestartRecording = () => {
    reset();
    start();
  };

  if (phase === "intro") {
    return (
      <div className="min-h-screen bg-paper">
        <CandidateFlowHeader workspaceName={data.interview.workspaceName} phase={phase} showStepper={false} />
        <div className="mx-auto grid max-w-5xl gap-10 px-4 py-10 md:grid-cols-2 md:px-10 md:py-12">
          <div>
            <p className="text-sm font-semibold text-primary">
              Video interview · {data.interview.title}
            </p>
            <h1 className="mt-4 font-display text-4xl font-medium leading-tight md:text-5xl">
              Tell {data.interview.workspaceName} a little more about you.
            </h1>
            <p className="mt-4 text-muted">
              There&apos;s no live interviewer and no trick questions — just {data.questions.length}{" "}
              short prompts you can answer whenever you&apos;re ready. Take your time, and re-record if
              you&apos;d like.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge>≈ {data.questions.length * 2} minutes</Badge>
              <Badge>{data.questions.length} questions</Badge>
              <Badge>Record anytime</Badge>
              {data.interview.allowRetakes && <Badge>Retakes allowed</Badge>}
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button size="lg" className="rounded-full" onClick={handleStartSession}>
                Get started →
              </Button>
              <button
                type="button"
                className="text-sm font-semibold text-primary hover:underline"
              >
                See how it works ›
              </button>
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
              {[
                {
                  title: "Check your setup",
                  desc: "Test camera and mic — takes about a minute.",
                },
                {
                  title: "Warm up",
                  desc: "One practice question that isn't recorded.",
                },
                {
                  title: "Record your answers",
                  desc: "Up to 2 minutes each — re-record anytime.",
                },
              ].map((step, i) => (
                <li key={step.title} className="flex gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[#E0D9C8] bg-white text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <div>
                    <div className="font-semibold">{step.title}</div>
                    <div className="text-[13px] text-faint">{step.desc}</div>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-6 flex items-center gap-2 border-t border-hairline pt-4 text-[12.5px] text-faint">
              <span className="text-primary">🔒</span>
              Recordings are shared only with the {data.interview.workspaceName} hiring team.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "setup") {
    const micLabel = mics.find((m) => m.deviceId === micId)?.label ?? "Built-in microphone";
    return (
      <div className="min-h-screen bg-paper">
        <CandidateFlowHeader workspaceName={data.interview.workspaceName} phase={phase} />
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 md:grid-cols-2 md:px-8 md:py-10">
          <div className="relative">
            <VideoPreview stream={stream} className="aspect-[4/3] w-full rounded-[16px]" />
            <div className="pointer-events-none absolute inset-8 rounded-[12px] border-2 border-dashed border-white/40" />
            <p className="mt-2 text-center text-xs font-medium text-faint">Center yourself in the frame</p>
          </div>
          <div className="rounded-[18px] bg-[#FAF7F0] p-6 md:p-8">
            <h2 className="font-display text-[27px] font-medium leading-tight">
              Let&apos;s check your setup
            </h2>
            <p className="mt-2 text-sm text-muted">We&apos;ll make sure you look and sound great.</p>
            <div className="mt-5 flex items-end gap-1">
              {levels.map((h, i) => (
                <div
                  key={i}
                  className="w-2 rounded-full bg-primary transition-all"
                  style={{ height: `${12 + h * 40}px` }}
                />
              ))}
            </div>
            <p className="mt-2 text-xs font-semibold text-primary">
              Mic level · {levels.some((l) => l > 0.1) ? "Sounds great" : "Speak to test"}
            </p>
            <label className="mt-4 block text-sm">
              <span className="font-semibold text-muted">Camera</span>
              <select
                className="mt-1 w-full rounded-[10px] border border-[#E4DDCD] bg-white px-3 py-2.5 text-sm"
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
            <label className="mt-3 block text-sm">
              <span className="font-semibold text-muted">Microphone</span>
              <select
                className="mt-1 w-full rounded-[10px] border border-[#E4DDCD] bg-white px-3 py-2.5 text-sm"
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
            <p className="mt-1 text-xs text-faint">{micLabel}</p>
            <ul className="mt-4 space-y-2 text-sm text-muted">
              <li className="flex items-center gap-2">
                <Check size={16} className="text-primary" /> Connection stable
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="text-primary" /> Camera detected
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="text-primary" /> Microphone detected
              </li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button className="flex-1" onClick={handleSetupContinue} disabled={!stream}>
                Everything looks good — Continue
              </Button>
              <Button variant="secondary" onClick={() => refresh()}>
                Run test again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "prep" && question) {
    const pct = thinkTime > 0 ? ((thinkTime - countdown) / thinkTime) * 100 : 100;
    return (
      <div className="min-h-screen bg-paper">
        <CandidateFlowHeader workspaceName={data.interview.workspaceName} phase={phase} />
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:grid-cols-[200px_1fr] md:px-8">
          <div className="hidden md:block">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-faint-2">Questions</p>
            <div className="mt-3 flex flex-col gap-2">
              {data.questions.map((q, i) => (
                <div
                  key={q.id}
                  className={`rounded-[10px] px-3 py-2 text-[12.5px] font-semibold ${
                    i === qIndex ? "bg-primary-tint text-primary" : "text-faint"
                  }`}
                >
                  Q{i + 1}
                </div>
              ))}
            </div>
          </div>
          <div className="text-center md:text-left">
            <p className="text-sm font-semibold text-faint md:hidden">
              Step 2 of 4 · Question {qIndex + 1} of {data.questions.length}
            </p>
            <h2 className="mt-3 font-display text-3xl font-medium leading-snug md:mt-0 md:text-4xl">
              {question.text}
            </h2>
            <div className="mt-4 flex justify-center gap-1.5 md:justify-start">
              {data.questions.map((_, i) => (
                <span
                  key={i}
                  className={`h-2 w-2 rounded-full ${i <= qIndex ? "bg-primary" : "bg-[#E4DDCD]"}`}
                />
              ))}
            </div>
            <div className="relative mt-8">
              <VideoPreview
                stream={stream}
                className="mx-auto aspect-video max-w-md rounded-[14px] md:float-right md:ml-4 md:w-[180px]"
                mirrored
              />
              <div className="mx-auto mt-6 grid h-36 w-36 place-items-center rounded-full bg-primary-tint md:mt-0">
                <div className="grid h-28 w-28 place-items-center rounded-full bg-paper shadow-inner">
                  <div className="text-4xl font-display">{countdown}</div>
                </div>
              </div>
              <p className="mt-4 text-sm font-semibold">Recording starts shortly</p>
              <p className="text-xs text-faint">
                {formatTime(timeLimit)} limit · {retakesLeft} retakes available
              </p>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
              <Button onClick={() => persist("recording", qIndex)}>Start recording now</Button>
              <Button variant="ghost" onClick={() => persist("recording", qIndex)}>
                Skip the countdown
              </Button>
            </div>
          </div>
        </div>
        <div
          className="pointer-events-none fixed inset-0 -z-10 opacity-10"
          style={{
            background: `conic-gradient(#1C6B47 ${pct}%, transparent ${pct}%)`,
          }}
        />
      </div>
    );
  }

  if (phase === "recording" && question) {
    const progressPct = timeLimit > 0 ? Math.min(100, (elapsed / timeLimit) * 100) : 0;
    return (
      <div className="flex min-h-screen flex-col bg-[#1a211c] text-white">
        <CandidateFlowHeader workspaceName={data.interview.workspaceName} phase={phase} />
        <div className="flex items-center justify-between px-4 py-3 md:px-6">
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
          <div className="absolute bottom-28 left-1/2 max-w-lg -translate-x-1/2 rounded-full bg-black/40 px-5 py-2 text-center font-display text-sm backdrop-blur-sm">
            {question.text}
          </div>
          <div className="absolute bottom-20 left-4 right-4 flex items-center gap-2 px-2 md:left-8 md:right-8">
            <span className="text-[11px] font-semibold tabular-nums">{formatTime(elapsed)}</span>
            <div className="h-1 flex-1 overflow-hidden rounded bg-white/25">
              <div className="h-full rounded bg-white transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="text-[11px] font-semibold tabular-nums text-white/60">
              {formatTime(timeLimit)}
            </span>
          </div>
          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-full border border-white/10 bg-black/50 px-5 py-3 backdrop-blur-md">
            {recording && (
              <Button
                variant="secondary"
                size="sm"
                className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                onClick={handleRestartRecording}
              >
                Restart
              </Button>
            )}
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
    const leftAfter = data.questions.length - qIndex - 1;
    return (
      <div className="min-h-screen bg-paper">
        <CandidateFlowHeader workspaceName={data.interview.workspaceName} phase={phase} />
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 md:grid-cols-2 md:px-8 md:py-10">
          <RecordedPlayback blob={playback} className="aspect-video w-full rounded-[14px] bg-black" />
          <div className="rounded-[14px] bg-[#FAF7F0] p-6 md:p-8">
            <h2 className="font-display text-2xl font-medium">Happy with this take?</h2>
            <p className="mt-2 text-sm text-muted">
              Question {qIndex + 1} of {data.questions.length}: {question.text}
            </p>
            <div className="mt-6 rounded-[12px] border border-hairline bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-faint-2">
                A couple of tips
              </p>
              <ul className="mt-2 space-y-1.5 text-[13px] text-muted">
                <li>· Speak clearly and look at the camera</li>
                <li>· It&apos;s okay to pause and collect your thoughts</li>
              </ul>
            </div>
            <p className="mt-4 text-[13px] font-semibold text-faint">
              Question {qIndex + 1} of {data.questions.length} · {leftAfter} left after this
            </p>
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
  const submittedDate = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return (
    <div className="min-h-screen bg-paper">
      <CandidateFlowHeader workspaceName={data.interview.workspaceName} phase="done" />
      <div className="mx-auto max-w-2xl px-6 py-12 text-center md:py-16">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary-tint text-primary">
          <Check size={28} />
        </div>
        <h1 className="mt-6 font-display text-[44px] font-medium leading-tight">
          That&apos;s a wrap{data.candidateName ? `, ${data.candidateName.split(" ")[0]}` : ""}.
        </h1>
        <p className="mt-3 text-muted">
          Thanks for taking the time — {data.interview.workspaceName} will review your answers soon.
        </p>
        <div className="mt-8 grid grid-cols-3 gap-4 rounded-[16px] border border-hairline bg-surface p-5">
          <div>
            <div className="font-display text-2xl">{questionCount}/{questionCount}</div>
            <div className="text-xs font-medium text-faint">answered</div>
          </div>
          <div>
            <div className="font-display text-2xl">≈ {questionCount * 2}</div>
            <div className="text-xs font-medium text-faint">minutes</div>
          </div>
          <div>
            <div className="font-display text-2xl">{submittedDate}</div>
            <div className="text-xs font-medium text-faint">Submitted</div>
          </div>
        </div>
        <div className="mt-10 text-left">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-faint-2">
            What happens next
          </p>
          <ol className="mt-4 space-y-3 text-sm text-muted">
            <li>1. The hiring team reviews your responses</li>
            <li>2. You&apos;ll hear back within 1–3 business days</li>
            <li>3. Check your email for updates from {data.interview.workspaceName}</li>
          </ol>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {data.interview.careersUrl && (
            <Link href={data.interview.careersUrl}>
              <Button variant="secondary">Back to {data.interview.workspaceName} careers</Button>
            </Link>
          )}
          <button type="button" className="text-sm font-semibold text-primary hover:underline">
            Email me a copy ›
          </button>
        </div>
        <p className="mt-8 text-xs text-faint">
          Your recordings are stored securely and shared only with the hiring team.
        </p>
      </div>
    </div>
  );
}

function CameraBlockedScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-paper">
      <CandidateFlowHeader workspaceName="Interview" phase="setup" showStepper={false} />
      <div className="mx-auto grid max-w-4xl gap-10 px-6 py-12 md:grid-cols-2 md:items-center">
        <div className="rounded-[16px] border border-hairline bg-panel p-6">
          <p className="text-sm font-semibold text-muted">Browser permissions</p>
          <div className="mt-4 rounded-[12px] border border-hairline bg-white p-4 text-sm">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <span className="font-semibold">candidatescreen.com</span>
              <span className="text-xs text-faint">Blocked</span>
            </div>
            <div className="mt-3 space-y-2 text-muted">
              <div>🎥 Camera — Blocked</div>
              <div>🎤 Microphone — Blocked</div>
            </div>
          </div>
        </div>
        <div>
          <div className="grid h-14 w-14 place-items-center rounded-[14px] bg-[#FBEAE7] text-record">
            <AlertCircle size={28} />
          </div>
          <h1 className="mt-6 font-display text-3xl font-medium">We can&apos;t see or hear you yet</h1>
          <p className="mt-3 text-sm text-muted">
            Your browser needs permission to use your camera and microphone for this interview.
          </p>
          <ol className="mt-6 space-y-3 text-left text-sm text-muted">
            <li>1. Click the camera icon in your browser&apos;s address bar</li>
            <li>2. Allow access to your camera and microphone</li>
            <li>3. Refresh and try again</li>
          </ol>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={onRetry}>Try again</Button>
            <button type="button" className="text-sm font-semibold text-primary hover:underline">
              Get help ›
            </button>
          </div>
        </div>
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
        <p className="mt-3 text-muted">{data.interview.title}</p>
        <p className="text-sm text-faint">{data.interview.workspaceName}</p>
        <Button className="mt-8">Request a new link</Button>
        <p className="mt-4 text-sm text-muted">
          Or email your recruiter at hello@candidatescreen.com
        </p>
      </div>
    </div>
  );
}

function AlreadySubmittedScreen({ data }: Props) {
  const qCount = data.questions.length;
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-tint text-primary">
          <Check size={28} />
        </div>
        <h1 className="mt-6 font-display text-3xl font-medium">
          You&apos;ve already completed this interview
        </h1>
        <p className="mt-3 text-muted">
          Thanks{data.candidateName ? `, ${data.candidateName.split(" ")[0]}` : ""} — your responses
          were submitted successfully.
        </p>
        <div className="mt-6 grid grid-cols-3 gap-3 rounded-[14px] border border-hairline bg-surface p-4 text-sm">
          <div>
            <div className="font-display text-xl">{qCount}/{qCount}</div>
            <div className="text-xs text-faint">answered</div>
          </div>
          <div>
            <div className="font-display text-xl">—</div>
            <div className="text-xs text-faint">Submitted</div>
          </div>
          <div>
            <div className="font-display text-xl">1–3 days</div>
            <div className="text-xs text-faint">Response time</div>
          </div>
        </div>
        <Button variant="secondary" className="mt-8">View confirmation</Button>
        {data.interview.careersUrl && (
          <Link href={data.interview.careersUrl} className="mt-4 inline-block text-sm font-semibold text-primary">
            Back to careers
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
