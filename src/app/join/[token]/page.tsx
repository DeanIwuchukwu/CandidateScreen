import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { acceptTeamInviteAction } from "@/lib/team/actions";
import { getTeamInviteByToken } from "@/lib/team/queries";
import { roleLabel } from "@/lib/team/permissions";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/ui/wordmark";

export default async function JoinTeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;
  const invite = await getTeamInviteByToken(token);
  const sessionUser = await getSessionUser();

  if (!invite) notFound();

  const invalid =
    invite.status !== "PENDING" ||
    invite.expired ||
    invite.expiresAt < new Date();

  const emailMatch =
    sessionUser &&
    sessionUser.email.toLowerCase() === invite.email.toLowerCase();

  async function acceptInvite() {
    "use server";
    await acceptTeamInviteAction(token);
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="border-b border-hairline-3 bg-surface px-8 py-5">
        <Wordmark href="/" />
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-12">
        {invalid ? (
          <>
            <h1 className="font-display text-[28px] font-medium">Invite unavailable</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              This invite has expired or is no longer valid. Ask your workspace admin to send a
              new one.
            </p>
            <Link href="/login" className="mt-6 text-sm font-semibold text-primary">
              Sign in
            </Link>
          </>
        ) : (
          <>
            <h1 className="font-display text-[28px] font-medium">
              Join {invite.workspace.name}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              <strong className="text-ink-2">{invite.invitedBy.name}</strong> invited you to join
              as <strong className="text-ink-2">{roleLabel(invite.role)}</strong>.
            </p>

            {error === "email_mismatch" && (
              <p className="mt-4 rounded-[10px] bg-[#FDF5F0] px-3 py-2.5 text-sm font-medium text-pass">
                Sign in as <strong>{invite.email}</strong> to accept this invite.
              </p>
            )}
            {error === "exists" && (
              <p className="mt-4 rounded-[10px] bg-[#FDF5F0] px-3 py-2.5 text-sm font-medium text-pass">
                An account already exists for this email. Sign in to accept the invite.
              </p>
            )}

            {sessionUser && emailMatch ? (
              <form action={acceptInvite} className="mt-8">
                <Button type="submit" className="w-full">
                  Accept invite
                </Button>
              </form>
            ) : sessionUser && !emailMatch ? (
              <div className="mt-8 space-y-3">
                <p className="text-sm text-muted">
                  You&apos;re signed in as <strong>{sessionUser.email}</strong>. Sign out and use{" "}
                  <strong>{invite.email}</strong> to accept.
                </p>
                <Link href="/login" className="text-sm font-semibold text-primary">
                  Switch account
                </Link>
              </div>
            ) : (
              <div className="mt-8 flex flex-col gap-3">
                <Link href={`/register?invite=${token}`}>
                  <Button className="w-full">Create account</Button>
                </Link>
                <Link href={`/login?next=${encodeURIComponent(`/join/${token}`)}`}>
                  <Button variant="secondary" className="w-full">
                    Sign in to accept
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
