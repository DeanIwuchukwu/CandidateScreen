import Link from "next/link";
import { loginAction } from "@/lib/auth/actions";
import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[.92fr_1.08fr]">
      <AuthBrandPanel
        headline="Hire the human, not the resume."
        subcopy="Async video interviews that give every candidate a fair shot — and give your team hours back each week."
      >
        <blockquote className="mt-8 rounded-[14px] border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
          <p className="font-display text-base italic leading-relaxed">
            &ldquo;We cut our screening time in half and candidates actually thank us for it.&rdquo;
          </p>
          <footer className="mt-2.5 text-[12.5px] font-semibold text-[#EFF3EC]/80">
            Talent team · Northwind
          </footer>
        </blockquote>
      </AuthBrandPanel>

      <div className="flex items-center justify-center bg-surface p-8">
        <div className="w-full max-w-[368px]">
          <h1 className="font-display text-[30px] font-medium leading-tight">Welcome back</h1>
          <p className="mt-2 text-[14.5px] text-muted">Sign in to your workspace.</p>

          <form action={loginAction} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-semibold text-muted">Work email</span>
              <Input name="email" type="email" required autoComplete="email" />
            </label>
            <label className="block">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[12.5px] font-semibold text-muted">Password</span>
                <Link href="/reset" className="text-[12.5px] font-semibold text-primary">
                  Forgot?
                </Link>
              </div>
              <Input name="password" type="password" required autoComplete="current-password" />
            </label>
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>

          <p className="mt-5 text-center text-[13.5px] text-muted">
            New to Candidate Screen?{" "}
            <Link href="/register" className="font-semibold text-primary">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
