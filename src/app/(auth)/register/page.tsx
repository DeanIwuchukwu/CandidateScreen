import Link from "next/link";
import { registerAction } from "@/lib/auth/actions";
import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[.92fr_1.08fr]">
      <AuthBrandPanel
        headline="Set up your team in minutes."
        subcopy="Create an interview, share a link, and start watching responses today. No credit card to begin."
      >
        <ul className="mt-8 space-y-3 text-[14.5px]">
          {[
            "Unlimited interviews on every plan",
            "Auto transcripts & scorecards",
            "GDPR-ready data handling",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2.5">
              <span className="grid h-[22px] w-[22px] place-items-center rounded-full bg-white/15 text-xs font-bold">
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      </AuthBrandPanel>

      <div className="flex items-center justify-center bg-surface p-8">
        <div className="w-full max-w-[380px]">
          <h1 className="font-display text-[30px] font-medium leading-tight">Create your account</h1>
          <p className="mt-2 text-[14.5px] text-muted">Start a free workspace for your team.</p>

          <form action={registerAction} className="mt-6 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-semibold text-muted">Full name</span>
                <Input name="name" required autoComplete="name" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-semibold text-muted">Company</span>
                <Input name="company" required autoComplete="organization" />
              </label>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-semibold text-muted">Work email</span>
              <Input name="email" type="email" required autoComplete="email" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-semibold text-muted">Password</span>
              <Input name="password" type="password" required minLength={8} autoComplete="new-password" />
            </label>
            <Button type="submit" className="w-full">
              Create account
            </Button>
          </form>

          <p className="mt-3 text-center text-xs text-faint-2">
            By continuing you agree to our Terms and Privacy Policy.
          </p>
          <p className="mt-4 text-center text-[13.5px] text-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
