"use client";

import { useState, useTransition } from "react";
import type { WorkspaceRole } from "@prisma/client";
import { AvatarCircle } from "@/components/recruiter/recruiter-ui";
import { Button } from "@/components/ui/button";
import { InviteTeamMemberModal } from "@/components/recruiter/invite-team-member-modal";
import {
  removeMemberAction,
  resendTeamInviteAction,
  revokeTeamInviteAction,
  updateMemberRoleAction,
} from "@/lib/team/actions";
import type { TeamInviteRow, TeamMemberRow } from "@/lib/team/queries";

export function TeamSection({
  members,
  pendingInvites,
  isAdmin,
}: {
  members: TeamMemberRow[];
  pendingInvites: TeamInviteRow[];
  isAdmin: boolean;
}) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const totalCount = members.length + pendingInvites.length;

  function runAction(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error ?? "Something went wrong.");
    });
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-hairline scroll-mt-24" id="team">
        <div className="flex items-center justify-between px-[22px] py-4">
          <h2 className="text-[15px] font-semibold">Team · {totalCount} members</h2>
          {isAdmin && (
            <Button size="sm" type="button" onClick={() => setInviteOpen(true)}>
              <span className="mr-1">+</span> Invite
            </Button>
          )}
        </div>

        {error && (
          <p className="px-[22px] pb-2 text-sm font-medium text-pass" role="alert">
            {error}
          </p>
        )}

        {members.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-3 border-t border-hairline-2 px-[22px] py-3"
          >
            <AvatarCircle initials={m.avatar.initials} color={m.avatar.color} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-semibold">
                {m.name}
                {m.isYou && <span className="font-medium text-faint-2"> · you</span>}
              </div>
              <div className="text-[11.5px] font-medium text-faint">{m.email}</div>
            </div>
            {isAdmin && !m.isYou ? (
              <div className="flex items-center gap-2">
                <select
                  value={m.role}
                  disabled={pending}
                  onChange={(e) =>
                    runAction(() =>
                      updateMemberRoleAction(m.id, e.target.value as WorkspaceRole),
                    )
                  }
                  className="rounded-[8px] border border-[#E4DDCD] bg-white px-2 py-1 text-[11px] font-semibold"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="RECRUITER">Recruiter</option>
                </select>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => runAction(() => removeMemberAction(m.id))}
                  className="text-[11px] font-semibold text-pass hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  m.role === "ADMIN"
                    ? "bg-primary-tint text-primary"
                    : "bg-hairline-2 text-muted"
                }`}
              >
                {m.roleLabel}
              </span>
            )}
          </div>
        ))}

        {pendingInvites.map((inv) => (
          <div
            key={inv.id}
            className="flex items-center gap-3 border-t border-hairline-2 px-[22px] py-3"
          >
            <AvatarCircle initials={inv.avatar.initials} color={inv.avatar.color} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-semibold">
                {inv.email.split("@")[0]}
                <span className="font-medium text-warn"> · pending</span>
              </div>
              <div className="text-[11.5px] font-medium text-faint">{inv.email}</div>
            </div>
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-hairline-2 px-2.5 py-1 text-[11px] font-semibold text-muted">
                  {inv.roleLabel}
                </span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => runAction(() => resendTeamInviteAction(inv.id))}
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  Resend
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => runAction(() => revokeTeamInviteAction(inv.id))}
                  className="text-[11px] font-semibold text-pass hover:underline"
                >
                  Revoke
                </button>
              </div>
            ) : (
              <span className="rounded-full bg-hairline-2 px-2.5 py-1 text-[11px] font-semibold text-muted">
                {inv.roleLabel}
              </span>
            )}
          </div>
        ))}
      </div>

      <InviteTeamMemberModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </>
  );
}
