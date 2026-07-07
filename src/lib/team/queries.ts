import { prisma } from "@/lib/db";
import type { WorkspaceRole } from "@prisma/client";
import { isDevBypass } from "@/lib/dev/bypass";
import { MOCK_WORKSPACE_MEMBERS } from "@/lib/dev/mock-data";
import { memberAvatar } from "@/lib/team/avatars";
import { roleLabel } from "@/lib/team/permissions";

export type TeamMemberRow = {
  kind: "member";
  id: string;
  userId: string;
  name: string;
  email: string;
  role: WorkspaceRole;
  roleLabel: string;
  avatar: { initials: string; color: string };
  isYou: boolean;
};

export type TeamInviteRow = {
  kind: "invite";
  id: string;
  email: string;
  role: WorkspaceRole;
  roleLabel: string;
  avatar: { initials: string; color: string };
};

export type TeamRoster = {
  members: TeamMemberRow[];
  pendingInvites: TeamInviteRow[];
};

export async function getTeamInviteByToken(token: string) {
  if (isDevBypass()) return null;

  const invite = await prisma.workspaceInvite.findUnique({
    where: { token },
    include: {
      workspace: true,
      invitedBy: { select: { name: true } },
    },
  });

  if (!invite) return null;
  if (invite.status !== "PENDING") return { ...invite, expired: invite.status === "EXPIRED" };
  if (invite.expiresAt < new Date()) {
    await prisma.workspaceInvite.update({
      where: { id: invite.id },
      data: { status: "EXPIRED" },
    });
    return { ...invite, status: "EXPIRED" as const, expired: true };
  }

  return { ...invite, expired: false };
}

export async function getTeamRoster(
  workspaceId: string,
  currentUserId: string,
): Promise<TeamRoster> {
  if (isDevBypass()) {
    const members = MOCK_WORKSPACE_MEMBERS.filter((m) => m.note !== "pending").map((m) => ({
      kind: "member" as const,
      id: m.id,
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      roleLabel: roleLabel(m.role),
      avatar: m.avatar,
      isYou: m.userId === currentUserId,
    }));

    const pendingInvites: TeamInviteRow[] = MOCK_WORKSPACE_MEMBERS.filter(
      (m) => m.note === "pending",
    ).map((m) => ({
      kind: "invite" as const,
      id: `invite-${m.id}`,
      email: m.user.email,
      role: m.role,
      roleLabel: roleLabel(m.role),
      avatar: memberAvatar(m.user.name, m.user.email),
    }));

    return { members, pendingInvites };
  }

  const [members, pendingInvites] = await Promise.all([
    prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.workspaceInvite.findMany({
      where: { workspaceId, status: "PENDING", expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    members: members.map((m) => ({
      kind: "member" as const,
      id: m.id,
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      roleLabel: roleLabel(m.role),
      avatar: memberAvatar(m.user.name, m.user.email),
      isYou: m.userId === currentUserId,
    })),
    pendingInvites: pendingInvites.map((inv) => ({
      kind: "invite" as const,
      id: inv.id,
      email: inv.email,
      role: inv.role,
      roleLabel: roleLabel(inv.role),
      avatar: memberAvatar(inv.email.split("@")[0] ?? inv.email, inv.email),
    })),
  };
}
