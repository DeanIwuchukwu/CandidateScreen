"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const HELP_EMAIL = "hello@candidatescreen.com";

export function CandidateHelpLink({
  label = "Get help ›",
  className = "text-sm font-semibold text-primary hover:underline",
}: {
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {label}
      </button>
      {open && <CandidateHelpDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function CandidateHelpDialog({ onClose }: { onClose: () => void }) {
  const mailto = `mailto:${HELP_EMAIL}?subject=${encodeURIComponent("Help with my video interview")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(24,33,27,0.34)]"
        aria-label="Close help"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-labelledby="candidate-help-title"
        className="relative w-full max-w-md rounded-[18px] border border-hairline bg-surface p-6 shadow-[0_40px_80px_-30px_rgba(20,40,30,0.55)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="candidate-help-title" className="font-display text-[22px] font-medium">
              Need a hand?
            </h2>
            <p className="mt-2 text-sm text-muted">
              Most issues are fixed by allowing camera and microphone access in your browser.
            </p>
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

        <ol className="mt-5 space-y-3 text-sm text-muted">
          <li>
            <span className="font-semibold text-ink-2">1. Check browser permissions</span>
            <p className="mt-1">
              Click the lock or camera icon in your address bar and allow camera and microphone for
              this site.
            </p>
          </li>
          <li>
            <span className="font-semibold text-ink-2">2. Close other apps using your camera</span>
            <p className="mt-1">
              Zoom, Teams, or FaceTime can block access. Quit them and refresh this page.
            </p>
          </li>
          <li>
            <span className="font-semibold text-ink-2">3. Try another browser</span>
            <p className="mt-1">Chrome, Edge, and Safari work best for video interviews.</p>
          </li>
          <li>
            <span className="font-semibold text-ink-2">4. Still stuck?</span>
            <p className="mt-1">
              Email us at{" "}
              <a href={mailto} className="font-semibold text-primary hover:underline">
                {HELP_EMAIL}
              </a>{" "}
              and we&apos;ll get you recording.
            </p>
          </li>
        </ol>

        <div className="mt-6 flex justify-end gap-2.5">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              window.location.href = mailto;
            }}
          >
            Email support
          </Button>
        </div>
      </div>
    </div>
  );
}
