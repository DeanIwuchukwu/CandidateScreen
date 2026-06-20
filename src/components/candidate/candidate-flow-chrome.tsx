import type { CandidatePhase } from "@/lib/types";

const STEPS = ["Setup", "Practice", "Record", "Submit"] as const;

function stepIndex(phase: CandidatePhase): number {
  switch (phase) {
    case "intro":
      return -1;
    case "setup":
      return 0;
    case "prep":
      return 1;
    case "recording":
    case "review":
      return 2;
    case "done":
      return 3;
    default:
      return -1;
  }
}

export function CandidateFlowHeader({
  workspaceName,
  phase,
  showStepper = true,
}: {
  workspaceName: string;
  phase: CandidatePhase;
  showStepper?: boolean;
}) {
  const active = stepIndex(phase);

  return (
    <header className="border-b border-hairline-3 bg-surface">
      <div className="flex items-center justify-between px-4 py-3.5 md:px-8">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span className="text-[15px] font-semibold tracking-tight">Candidate Screen</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-ink text-[11px] font-bold text-white">
            {workspaceName.charAt(0).toUpperCase()}
          </span>
          <span className="hidden font-semibold sm:inline">{workspaceName}</span>
        </div>
      </div>
      {showStepper && active >= 0 && (
        <div className="flex flex-wrap items-center justify-center gap-4 border-t border-hairline-3 px-4 py-3 md:gap-6">
          {STEPS.map((label, i) => {
            const done = active > i;
            const current = active === i;
            return (
              <span
                key={label}
                className={`flex items-center gap-1.5 text-[13px] font-semibold ${
                  done || current ? "text-ink" : "text-faint-2"
                }`}
              >
                <span
                  className={`grid h-5 w-5 place-items-center rounded-full text-[11px] ${
                    done
                      ? "bg-primary text-white"
                      : current
                        ? "border-2 border-primary text-primary"
                        : "border border-[#E2DBCB] text-faint-2"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </span>
            );
          })}
        </div>
      )}
    </header>
  );
}

export function HeroVideoMock({ questionText }: { questionText?: string }) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] bg-gradient-to-br from-[#6E7C6F] via-[#4C574E] to-[#333B35] shadow-[0_30px_60px_-28px_rgba(20,40,30,.45)]">
      <div className="absolute inset-0 bg-[radial-gradient(46%_42%_at_36%_20%,rgba(255,244,224,.32),transparent_70%)]" />
      <div className="absolute bottom-[-6%] left-1/2 h-[62%] w-[54%] -translate-x-1/2 bg-[radial-gradient(72%_92%_at_50%_22%,#2A352E_60%,transparent_80%)]" />
      <div className="absolute bottom-[36%] left-1/2 aspect-square w-[18%] -translate-x-1/2 rounded-full bg-[radial-gradient(64%_64%_at_42%_34%,#37433A_55%,transparent_78%)]" />
      <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-sm">
        <span className="h-2 w-2 rounded-full bg-record" />
        <span className="text-xs font-bold tracking-wide text-white">REC</span>
        <span className="text-xs font-semibold text-white/85">00:42</span>
      </div>
      <p className="absolute bottom-4 left-4 right-4 rounded-[11px] bg-black/25 px-4 py-2.5 text-center font-display text-[17px] leading-snug text-white/95 backdrop-blur-sm">
        {questionText ?? "Tell us about a project you're proud of."}
      </p>
    </div>
  );
}
