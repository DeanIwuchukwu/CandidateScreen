import Link from "next/link";
import { requestPasswordResetAction } from "@/lib/auth/actions";
import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ResetPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[.92fr_1.08fr]">
      <AuthBrandPanel
        headline="It happens to the best of us."
        subcopy="We'll email you a secure link to set a new password."
      />

      <div className="flex items-center justify-center bg-surface p-8">
        <div className="w-full max-w-[368px]">
          <h1 className="font-display text-[30px] font-medium leading-tight">Reset your password</h1>
          <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
            Enter the email tied to your account and we&apos;ll send a reset link.
          </p>

          <form action={requestPasswordResetAction} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-semibold text-muted">Work email</span>
              <Input name="email" type="email" required autoComplete="email" />
            </label>
            <Button type="submit" className="w-full">
              Send reset link
            </Button>
          </form>

          <Link
            href="/login"
            className="mt-5 flex items-center justify-center gap-2 text-[13.5px] font-semibold text-primary"
          >
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
