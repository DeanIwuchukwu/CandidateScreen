import Link from "next/link";
import { Play, Video, Shield, FileText, Star } from "lucide-react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { HeroVideoMock } from "@/components/candidate/candidate-flow-chrome";

export default function LandingPage() {
  return (
    <>
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:px-14 md:py-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-tint px-3.5 py-1.5 text-[12.5px] font-semibold text-primary">
            Async video interviews
          </span>
          <h1 className="mt-5 font-display text-[clamp(2.5rem,4.5vw,3.625rem)] font-medium leading-[1.02] tracking-tight text-ink xl:text-[58px]">
            Hire the human, not the resume.
          </h1>
          <p className="mt-5 max-w-[460px] text-lg leading-relaxed text-muted">
            Let candidates record short answers on their own time. Your team reviews in minutes —
            with transcripts, scorecards, and a fairer, more structured process.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/register">
              <Button size="lg">Start free</Button>
            </Link>
            <Link href="/#product">
              <Button size="lg" variant="secondary" className="gap-2.5">
                <span className="grid h-[26px] w-[26px] place-items-center rounded-full bg-primary-tint">
                  <Play size={12} className="fill-primary text-primary" />
                </span>
                Watch 2-min demo
              </Button>
            </Link>
          </div>
          <p className="mt-5 text-[13px] font-medium text-faint">
            No credit card · Free for your first role
          </p>
        </div>
        <div className="relative">
          <HeroVideoMock />
          <div className="absolute -right-5 top-9 w-[188px] rounded-[14px] border border-hairline bg-surface p-4 shadow-[0_18px_40px_-20px_rgba(20,40,30,.35)]">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-faint-2">
              Scorecard
            </div>
            <StarRating value={4} readOnly />
            <div className="mt-2 text-[13px] font-semibold">Jordan Reyes</div>
            <div className="text-[11.5px] font-medium text-faint">Strong · advance</div>
          </div>
        </div>
      </section>

      <section className="border-y border-hairline-3 px-6 py-7 md:px-14">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6">
          <span className="text-[13px] font-medium text-faint-2">Trusted by talent teams at</span>
          <div className="flex flex-wrap gap-8 font-display text-xl text-[#7C8077]">
            {["Northwind", "Lumen", "Atlas&Co", "Vireo", "Harbor"].map((n) => (
              <span key={n}>{n}</span>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-16 md:px-14">
        <div className="mx-auto mb-11 max-w-xl text-center">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-3 font-display text-4xl font-medium leading-tight">
            Up and running in an afternoon
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            ["1", "Create an interview", "Write a few questions, set time limits, and add your branding."],
            ["2", "Share one link", "Candidates record on their own time, from any device — no scheduling."],
            ["3", "Review together", "Watch answers, score against a rubric, and decide as a team."],
          ].map(([n, title, copy]) => (
            <div key={n} className="rounded-[18px] border border-hairline bg-surface p-7">
              <div className="grid h-10 w-10 place-items-center rounded-[11px] bg-primary-tint font-display text-xl text-primary">
                {n}
              </div>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="product" className="mx-auto max-w-7xl px-6 py-8 md:px-14">
        <div className="grid gap-5 md:grid-cols-2">
          {[
            [Video, "Async by design", "No calendar tetris. Candidates answer when they're at their best, and you review when it suits you."],
            [Shield, "Fair & structured", "Everyone answers the same questions and is scored on the same rubric — less bias, better signal."],
            [FileText, "Auto transcripts", "Every answer is transcribed and searchable, so you can skim, quote, and share in seconds."],
            [Star, "Built-in scorecards", "Rate against your criteria, leave notes, and reach a decision the whole panel can see."],
          ].map(([Icon, title, copy]) => (
            <div key={title as string} className="flex gap-4 rounded-[18px] border border-hairline bg-surface p-8">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-tint text-primary">
                <Icon size={24} strokeWidth={1.7} />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{title as string}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{copy as string}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="customers" className="mx-auto max-w-7xl px-6 py-12 md:px-14">
        <div className="rounded-[22px] bg-primary px-8 py-12 text-[#EFF3EC] md:px-12">
          <div className="grid gap-8 md:grid-cols-3 md:divide-x md:divide-white/15">
            {[
              ["50%", "less time spent screening"],
              ["86%", "of candidates finish"],
              ["4.9/5", "candidate experience rating"],
            ].map(([stat, label]) => (
              <div key={label} className="text-center md:px-6">
                <div className="font-display text-5xl">{stat}</div>
                <div className="mt-1.5 text-sm text-[#EFF3EC]/80">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[760px] px-6 py-16 text-center md:px-14">
        <p className="font-display text-[30px] leading-[1.4] text-ink-2">
          &ldquo;We replaced a week of phone screens with a single afternoon of reviewing —{" "}
          <br className="hidden sm:block" />
          and our candidates kept telling us how human it felt.&rdquo;
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-primary text-sm font-semibold text-white">
            MC
          </span>
          <div className="text-left text-sm">
            <div className="font-semibold">Maya Chen</div>
            <div className="text-faint">Talent Partner, Northwind</div>
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-6 py-16 md:px-14">
        <div className="mx-auto mb-10 max-w-xl text-center">
          <Eyebrow>Pricing</Eyebrow>
          <h2 className="mt-3 font-display text-4xl font-medium leading-tight">
            Simple plans that grow with you
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              name: "Starter",
              price: "$49",
              highlight: false,
              subtitle: "For one or two roles at a time",
              features: [
                "100 responses / month",
                "2 team members",
                "Transcripts & scorecards",
              ],
            },
            {
              name: "Team",
              price: "$199",
              highlight: true,
              subtitle: "For active, growing hiring teams",
              features: [
                "500 responses / month",
                "Unlimited team members",
                "Custom branding & rubrics",
                "Analytics & ATS export",
              ],
            },
            {
              name: "Scale",
              price: "Custom",
              highlight: false,
              subtitle: "For high-volume & enterprise",
              features: [
                "Unlimited responses",
                "SSO & SCIM",
                "Dedicated support & SLA",
              ],
            },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-[18px] border p-7 ${
                plan.highlight
                  ? "border-[1.5px] border-primary bg-surface shadow-[0_20px_44px_-24px_rgba(28,107,71,.5)]"
                  : "border-hairline bg-surface"
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-2.5 left-6 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-white">
                  Most popular
                </span>
              )}
              <div className="font-semibold">{plan.name}</div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-display text-4xl">{plan.price}</span>
                {plan.price !== "Custom" && (
                  <span className="text-sm font-medium text-faint">/ mo</span>
                )}
              </div>
              <p className="mt-1 text-[13px] font-medium text-faint">{plan.subtitle}</p>
              <ul className="mb-6 mt-5 flex flex-col gap-2.5 text-sm font-medium text-ink-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span className="text-primary">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Button className="mt-auto" variant={plan.highlight ? "primary" : "secondary"}>
                {plan.name === "Scale" ? "Talk to sales" : "Start free"}
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 md:px-14">
        <div className="rounded-[22px] border border-hairline bg-surface px-8 py-14 text-center">
          <h2 className="font-display text-[40px] font-medium leading-[1.08]">
            Start screening better this week.
          </h2>
          <p className="mt-3 text-muted">Free for your first role. No credit card required.</p>
          <Link href="/register">
            <Button size="lg" className="mt-6">
              Create your free workspace
            </Button>
          </Link>
        </div>
      </section>
      <MarketingFooter />
    </>
  );
}
