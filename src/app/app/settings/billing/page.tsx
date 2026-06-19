import { requireSessionUser } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { SettingsTabs } from "@/components/recruiter/recruiter-ui";

const plans = [
  {
    name: "Starter",
    price: "$49",
    desc: "For one or two roles at a time",
    features: ["100 responses / month", "2 team members", "Transcripts & scorecards"],
    cta: "Downgrade",
    current: false,
  },
  {
    name: "Team",
    price: "$199",
    desc: "For active, growing hiring teams",
    features: [
      "500 responses / month",
      "Unlimited team members",
      "Custom branding & rubrics",
      "Analytics & ATS export",
    ],
    cta: "Your plan",
    current: true,
  },
  {
    name: "Scale",
    price: "Custom",
    desc: "For high-volume & enterprise",
    features: ["Unlimited responses", "SSO & SCIM", "Dedicated support & SLA"],
    cta: "Talk to sales",
    current: false,
  },
];

const invoices = [
  ["Jun 1, 2026", "$199.00"],
  ["May 1, 2026", "$199.00"],
  ["Apr 1, 2026", "$199.00"],
];

export default async function BillingPage() {
  await requireSessionUser();

  return (
    <>
      <div className="px-8 pt-[22px]">
        <h1 className="font-display text-[28px] font-medium leading-none">Settings</h1>
        <SettingsTabs active="billing" />
      </div>

      <div className="flex flex-col gap-6 px-8 py-[26px]">
        <div className="grid gap-[18px] lg:grid-cols-[1.3fr_1fr]">
          <div className="flex items-center justify-between rounded-2xl border border-hairline px-6 py-[22px]">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-faint-2">
                Current plan
              </div>
              <div className="mt-2 flex items-baseline gap-2.5">
                <span className="font-display text-[30px]">Team</span>
                <span className="rounded-full bg-primary-tint px-2.5 py-1 text-[13px] font-semibold text-primary">
                  Active
                </span>
              </div>
              <p className="mt-1.5 text-[13px] font-medium text-faint">
                $199 / month · renews Jul 1, 2026
              </p>
            </div>
            <Button variant="secondary">Manage plan</Button>
          </div>

          <div className="rounded-2xl border border-hairline px-6 py-[22px]">
            <div className="mb-2.5 flex justify-between text-[13px] font-semibold">
              <span>Responses this month</span>
              <span className="text-muted">312 / 500</span>
            </div>
            <div className="h-2 overflow-hidden rounded bg-[#EEE8DB]">
              <div className="h-full w-[62%] rounded bg-primary" />
            </div>
            <p className="mt-2.5 text-xs font-medium text-faint">
              Resets Jul 1 · 188 responses left on your plan
            </p>
          </div>
        </div>

        <div>
          <div className="mb-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-faint-2">
            Change plan · billed monthly
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border p-[22px] ${
                  plan.current
                    ? "border-[1.5px] border-primary shadow-[0_16px_36px_-22px_rgba(28,107,71,.5)]"
                    : "border-hairline"
                }`}
              >
                {plan.current && (
                  <span className="absolute -top-2.5 left-[22px] rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-white">
                    Current plan
                  </span>
                )}
                <div className="text-base font-semibold">{plan.name}</div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-[34px] leading-none">{plan.price}</span>
                  {plan.price !== "Custom" && (
                    <span className="text-[13px] font-medium text-faint">/ mo</span>
                  )}
                </div>
                <p className="mb-[18px] mt-1 text-[12.5px] font-medium text-faint">{plan.desc}</p>
                <div className="flex flex-col gap-2.5 text-[13px] font-medium text-ink">
                  {plan.features.map((f) => (
                    <span key={f} className="flex gap-2">
                      <span className="text-primary">✓</span>
                      {f}
                    </span>
                  ))}
                </div>
                <Button
                  className="mt-auto w-full"
                  variant={plan.current ? undefined : "secondary"}
                  disabled={plan.current}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-[18px] lg:grid-cols-[1fr_1.4fr]">
          <div className="rounded-2xl border border-hairline px-6 py-[22px]">
            <h2 className="mb-4 text-[15px] font-semibold">Payment method</h2>
            <div className="flex items-center gap-3.5 rounded-xl border border-hairline px-4 py-3.5">
              <div className="grid h-7 w-[42px] place-items-center rounded-md bg-ink text-[11px] font-bold text-white">
                VISA
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold">Visa ending 4242</div>
                <div className="text-xs font-medium text-faint">Expires 09 / 28</div>
              </div>
              <button type="button" className="text-[12.5px] font-semibold text-primary">
                Update
              </button>
            </div>
            <p className="mt-3 text-xs font-medium text-faint">
              Billing email · maya@northwind.com
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-hairline">
            <div className="px-[22px] py-4 text-[15px] font-semibold">Recent invoices</div>
            {invoices.map(([date, amount]) => (
              <div
                key={date}
                className="flex items-center justify-between border-t border-hairline-2 px-[22px] py-3"
              >
                <div>
                  <div className="text-[13.5px] font-semibold">{date}</div>
                  <div className="text-xs font-medium text-faint">Team · monthly</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[13.5px] font-semibold">{amount}</span>
                  <span className="rounded-full bg-primary-tint px-2 py-1 text-[11px] font-semibold text-primary">
                    Paid
                  </span>
                  <button type="button" className="text-[12.5px] font-semibold text-primary">
                    PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
