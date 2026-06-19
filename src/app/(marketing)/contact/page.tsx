import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { submitContactForm } from "@/lib/marketing/actions";

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;

  return (
    <div className="min-h-screen bg-paper">
      <MarketingNav />
      <main className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-[.9fr_1.1fr] md:px-14">
        <div>
          <Eyebrow>Contact</Eyebrow>
          <h1 className="mt-3.5 font-display text-[46px] font-medium leading-tight">
            Let&apos;s talk about your hiring.
          </h1>
          <p className="mt-4 max-w-sm text-[17px] leading-relaxed text-muted">
            Whether you&apos;re screening for one role or one hundred, we&apos;ll help you get set up.
            Most messages get a reply within a few hours.
          </p>
          <div className="mt-8 space-y-4 text-sm">
            <p>
              <span className="font-semibold">Email us</span>
              <br />
              hello@candidatescreen.com
            </p>
            <p>
              <span className="font-semibold">Response time</span>
              <br />
              Within a few hours, Mon–Fri
            </p>
          </div>
        </div>
        <form
          action={submitContactForm}
          className="rounded-[20px] border border-hairline bg-surface p-9 shadow-[0_20px_44px_-28px_rgba(20,40,30,.3)]"
        >
          {sent && (
            <p className="mb-4 rounded-[10px] bg-primary-tint px-4 py-3 text-sm font-semibold text-primary">
              Message sent — we&apos;ll be in touch soon.
            </p>
          )}
          <div className="mb-4 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-semibold text-muted">Full name</span>
              <Input name="name" required placeholder="Jane Doe" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-semibold text-muted">Work email</span>
              <Input name="email" type="email" required placeholder="jane@company.com" />
            </label>
          </div>
          <div className="mb-4 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-semibold text-muted">Company</span>
              <Input name="company" placeholder="Acme Inc." />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-semibold text-muted">Team size</span>
              <select
                name="teamSize"
                className="w-full rounded-[10px] border border-[#E4DDCD] px-3.5 py-3 text-sm"
              >
                <option>1–10</option>
                <option>11–50</option>
                <option>51–200</option>
                <option>200+</option>
              </select>
            </label>
          </div>
          <label className="mb-4 block">
            <span className="mb-1.5 block text-[12.5px] font-semibold text-muted">How can we help?</span>
            <textarea
              name="message"
              required
              className="min-h-[110px] w-full rounded-[10px] border border-[#E4DDCD] px-3.5 py-3 text-sm outline-none focus:border-primary"
              placeholder="We're hiring for a few design roles this quarter…"
            />
          </label>
          <Button type="submit" className="w-full">
            Send message
          </Button>
        </form>
      </main>
      <MarketingFooter />
    </div>
  );
}
