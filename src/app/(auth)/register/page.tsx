import Link from "next/link";
import { notFound } from "next/navigation";
import { registerAction } from "@/lib/auth/actions";
import { registerWithTeamInviteAction } from "@/lib/team/actions";
import { getTeamInviteByToken } from "@/lib/team/queries";
import { roleLabel } from "@/lib/team/permissions";
import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";
import { RegisterPasswordField } from "@/components/auth/register-password-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string; error?: string }>;
}) {
  const { invite: inviteToken, error } = await searchParams;

  if (inviteToken) {
    const invite = await getTeamInviteByToken(inviteToken);
    if (!invite || invite.status !== "PENDING" || invite.expired) notFound();

    return (
      <div className="grid min-h-screen lg:grid-cols-[.92fr_1.08fr]">
        <AuthBrandPanel
          headline={`You're invited to ${invite.workspace.name}.`}
          subcopy={`${invite.invitedBy.name} invited you to join as ${roleLabel(invite.role)}.`}
        />

        <div className="flex items-center justify-center bg-surface p-8">
          <div className="w-full max-w-[380px]">
            <h1 className="font-display text-[30px] font-medium leading-tight">Create your account</h1>
            <p className="mt-2 text-[14.5px] text-muted">
              Join <strong className="text-ink-2">{invite.workspace.name}</strong> on Candidate Screen.
            </p>

            {error === "invalid" && (
              <p className="mt-3 text-sm font-medium text-pass" role="alert">
                Check your details and try again. Email must match the invite.
              </p>
            )}

            <form action={registerWithTeamInviteAction} className="mt-6 space-y-4">
              <input type="hidden" name="inviteToken" value={inviteToken} />
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-semibold text-muted">Full name</span>
                <Input name="name" required autoComplete="name" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-semibold text-muted">Work email</span>
                <Input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  defaultValue={invite.email}
                  readOnly
                  className="bg-paper-2"
                />
              </label>
              <RegisterPasswordField />
              <Button type="submit" className="w-full">
                Join workspace
              </Button>
            </form>

            <p className="mt-4 text-center text-[13.5px] text-muted">
              Already have an account?{" "}
              <Link
                href={`/login?next=${encodeURIComponent(`/join/${inviteToken}`)}`}
                className="font-semibold text-primary"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

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

          {error === "exists" && (
            <p className="mt-3 text-sm font-medium text-pass" role="alert">
              An account with this email already exists.{" "}
              <Link href="/login" className="text-primary underline">
                Sign in
              </Link>
            </p>
          )}
          {error === "invalid" && (
            <p className="mt-3 text-sm font-medium text-pass" role="alert">
              Please check your details and try again.
            </p>
          )}

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
            <RegisterPasswordField />
            <Button type="submit" className="w-full">
              Create account
            </Button>
          </form>

          <p className="mt-3 text-center text-xs text-faint-2">
            By continuing you agree to our{" "}
            <Link href="#" className="font-semibold text-primary underline">
              Terms
            </Link>
            {" and "}
            <Link href="#" className="font-semibold text-primary underline">
              Privacy Policy
            </Link>
            .
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
