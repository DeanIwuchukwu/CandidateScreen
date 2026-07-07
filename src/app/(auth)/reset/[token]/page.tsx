import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { completePasswordResetAction } from "@/lib/auth/actions";
import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function ResetTokenPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;

  const reset = await prisma.passwordReset.findUnique({ where: { token } });
  if (!reset) notFound();

  const expired = reset.expiresAt < new Date();

  return (
    <div className="grid min-h-screen lg:grid-cols-[.92fr_1.08fr]">
      <AuthBrandPanel
        headline="Choose a new password."
        subcopy="Pick something strong you haven't used elsewhere."
      />

      <div className="flex items-center justify-center bg-surface p-8">
        <div className="w-full max-w-[368px]">
          <h1 className="font-display text-[30px] font-medium leading-tight">Set new password</h1>

          {expired || error === "expired" ? (
            <>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
                This reset link has expired. Request a new one from the sign-in page.
              </p>
              <Link
                href="/reset"
                className="mt-6 inline-flex items-center gap-2 text-[13.5px] font-semibold text-primary"
              >
                <ChevronLeft size={16} />
                Request new link
              </Link>
            </>
          ) : (
            <>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
                Enter a new password for <strong className="text-ink-2">{reset.email}</strong>.
              </p>

              {error === "invalid" && (
                <p className="mt-3 text-sm font-medium text-pass" role="alert">
                  Passwords must match and be at least 8 characters.
                </p>
              )}

              <form action={completePasswordResetAction.bind(null, token)} className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-[12.5px] font-semibold text-muted">
                    New password
                  </span>
                  <Input
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[12.5px] font-semibold text-muted">
                    Confirm password
                  </span>
                  <Input
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </label>
                <Button type="submit" className="w-full">
                  Update password
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
