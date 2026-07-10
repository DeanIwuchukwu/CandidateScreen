"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoPreview } from "@/components/candidate/video-preview";

const STEPS = [
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
] as const;

export function CandidateHowItWorksLink({
  workspaceName,
  label = "See how it works ›",
  className = "text-sm font-semibold text-primary hover:underline",
}: {
  workspaceName: string;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {label}
      </button>
      {open && (
        <CandidateHowItWorksDialog workspaceName={workspaceName} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

function CandidateHowItWorksDialog({
  workspaceName,
  onClose,
}: {
  workspaceName: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(24,33,27,0.34)]"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-labelledby="how-it-works-title"
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[18px] border border-hairline bg-panel p-6 shadow-[0_40px_80px_-30px_rgba(20,40,30,0.55)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-faint-2">
              What to expect
            </p>
            <h2 id="how-it-works-title" className="mt-2 font-display text-[24px] font-medium">
              How this interview works
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg bg-paper-2 text-faint"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <VideoPreview stream={null} className="mt-5 aspect-video w-full rounded-[14px]" />

        <ol className="mt-5 space-y-4 text-sm">
          {STEPS.map((step, i) => (
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

        <p className="mt-5 flex items-center gap-2 border-t border-hairline pt-4 text-[12.5px] text-faint">
          <span className="text-primary">🔒</span>
          Recordings are shared only with the {workspaceName} hiring team.
        </p>

        <div className="mt-6 flex justify-end">
          <Button type="button" size="sm" onClick={onClose}>
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}

export { STEPS as CANDIDATE_HOW_IT_WORKS_STEPS };
