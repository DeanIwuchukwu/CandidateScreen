"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth/session";
import { createToken } from "@/lib/auth/crypto";
import { createSession } from "@/lib/auth/session";
import { isDevBypass } from "@/lib/dev/bypass";
import { MOCK_USER } from "@/lib/dev/mock-data";
import { sendTeamInviteEmail } from "@/lib/email";
import { getUserWorkspace } from "@/lib/recruiter/queries";
import { INVITABLE_ROLES, isAdmin } from "@/lib/team/permissions";
import type { WorkspaceRole } from "@prisma/client";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "RECRUITER"]),
});

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

async function adminGuard(): Promise<
  | { user: { id: string; name: string; email: string }; workspace: { id: string; name: string }; role: WorkspaceRole }
  | { error: string }
> {
  const user = await requireSessionUser();
  if (isDevBypass()) {
    return {
      user,
      workspace: MOCK_USER.memberships[0]!.workspace,
      role: "ADMIN" as const,
    };
  }
  const membership = await getUserWorkspace(user.id);
  if (!isAdmin(membership.role)) {
    return { error: "Only admins can manage the team." };
  }
  return { user, workspace: membership.workspace, role: membership.role };
}

async function countAdmins(workspaceId: string) {
  return prisma.workspaceMember.count({
    where: { workspaceId, role: "ADMIN" },
  });
}

export async function inviteTeamMemberAction(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isDevBypass()) return { ok: true };

  const guard = await adminGuard();
  if ("error" in guard) return { ok: false, error: guard.error };

  const parsed = inviteSchema.safeParse({
    email: String(formData.get("email") || "").trim().toLowerCase(),
    role: String(formData.get("role") || ""),
  });
  if (!parsed.success) return { ok: false, error: "Enter a valid email and role." };

  if (!INVITABLE_ROLES.includes(parsed.data.role as WorkspaceRole)) {
    return { ok: false, error: "Invalid role." };
  }

  const email = parsed.data.email;
  const { workspace, user } = guard;

  const existingMember = await prisma.workspaceMember.findFirst({
    where: { workspaceId: workspace.id, user: { email } },
  });
  if (existingMember) {
    return { ok: false, error: "This person is already on the team." };
  }

  const token = createToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.workspaceInvite.deleteMany({
    where: { workspaceId: workspace.id, email, status: "PENDING" },
  });

  await prisma.workspaceInvite.create({
    data: {
      workspaceId: workspace.id,
      email,
      role: parsed.data.role,
      token,
      expiresAt,
      invitedById: user.id,
    },
  });

  const joinUrl = `${appUrl()}/join/${token}`;
  void sendTeamInviteEmail({
    to: email,
    inviterName: user.name,
    workspaceName: workspace.name,
    role: parsed.data.role,
    joinUrl,
  }).catch((err) => console.error("[email] team invite failed", err));

  revalidatePath("/app/settings");
  return { ok: true };
}

export async function resendTeamInviteAction(
  inviteId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isDevBypass()) return { ok: true };

  const guard = await adminGuard();
  if ("error" in guard) return { ok: false, error: guard.error };

  const invite = await prisma.workspaceInvite.findFirst({
    where: { id: inviteId, workspaceId: guard.workspace.id, status: "PENDING" },
  });
  if (!invite) return { ok: false, error: "Invite not found." };

  const token = createToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.workspaceInvite.update({
    where: { id: invite.id },
    data: { token, expiresAt },
  });

  void sendTeamInviteEmail({
    to: invite.email,
    inviterName: guard.user.name,
    workspaceName: guard.workspace.name,
    role: invite.role,
    joinUrl: `${appUrl()}/join/${token}`,
  }).catch((err) => console.error("[email] team invite resend failed", err));

  revalidatePath("/app/settings");
  return { ok: true };
}

export async function revokeTeamInviteAction(
  inviteId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isDevBypass()) return { ok: true };

  const guard = await adminGuard();
  if ("error" in guard) return { ok: false, error: guard.error };

  const updated = await prisma.workspaceInvite.updateMany({
    where: {
      id: inviteId,
      workspaceId: guard.workspace.id,
      status: "PENDING",
    },
    data: { status: "REVOKED" },
  });

  if (updated.count === 0) return { ok: false, error: "Invite not found." };

  revalidatePath("/app/settings");
  return { ok: true };
}

export async function updateMemberRoleAction(
  memberId: string,
  role: WorkspaceRole,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isDevBypass()) return { ok: true };

  const guard = await adminGuard();
  if ("error" in guard) return { ok: false, error: guard.error };

  if (!INVITABLE_ROLES.includes(role)) {
    return { ok: false, error: "Invalid role." };
  }

  const member = await prisma.workspaceMember.findFirst({
    where: { id: memberId, workspaceId: guard.workspace.id },
  });
  if (!member) return { ok: false, error: "Member not found." };

  if (member.role === "ADMIN" && role !== "ADMIN") {
    const admins = await countAdmins(guard.workspace.id);
    if (admins <= 1) {
      return { ok: false, error: "Cannot demote the last admin." };
    }
  }

  await prisma.workspaceMember.update({
    where: { id: member.id },
    data: { role },
  });

  revalidatePath("/app/settings");
  return { ok: true };
}

export async function removeMemberAction(
  memberId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isDevBypass()) return { ok: true };

  const guard = await adminGuard();
  if ("error" in guard) return { ok: false, error: guard.error };

  const member = await prisma.workspaceMember.findFirst({
    where: { id: memberId, workspaceId: guard.workspace.id },
  });
  if (!member) return { ok: false, error: "Member not found." };

  if (member.userId === guard.user.id) {
    return { ok: false, error: "You cannot remove yourself." };
  }

  if (member.role === "ADMIN") {
    const admins = await countAdmins(guard.workspace.id);
    if (admins <= 1) {
      return { ok: false, error: "Cannot remove the last admin." };
    }
  }

  await prisma.workspaceMember.delete({ where: { id: member.id } });

  revalidatePath("/app/settings");
  return { ok: true };
}

export async function acceptTeamInviteAction(token: string): Promise<void> {
  if (isDevBypass()) {
    redirect("/app");
  }

  const user = await requireSessionUser();
  const invite = await prisma.workspaceInvite.findUnique({
    where: { token },
    include: { workspace: true },
  });

  if (!invite || invite.status !== "PENDING" || invite.expiresAt < new Date()) {
    redirect(`/join/${token}?error=invalid`);
  }

  if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
    redirect(`/join/${token}?error=email_mismatch`);
  }

  const existing = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId: invite.workspaceId, userId: user.id },
    },
  });

  if (!existing) {
    await prisma.workspaceMember.create({
      data: {
        workspaceId: invite.workspaceId,
        userId: user.id,
        role: invite.role,
      },
    });
  }

  await prisma.workspaceInvite.update({
    where: { id: invite.id },
    data: { status: "ACCEPTED", acceptedAt: new Date() },
  });

  redirect("/app");
}

export async function registerWithTeamInviteAction(formData: FormData): Promise<void> {
  if (isDevBypass()) redirect("/app");

  const token = String(formData.get("inviteToken") || "");
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!token || name.length < 2 || !email || password.length < 8) {
    redirect(`/register?invite=${token}&error=invalid`);
  }

  const invite = await prisma.workspaceInvite.findUnique({ where: { token } });
  if (
    !invite ||
    invite.status !== "PENDING" ||
    invite.expiresAt < new Date() ||
    invite.email.toLowerCase() !== email
  ) {
    redirect(`/register?invite=${token}&error=invalid`);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    redirect(`/join/${token}?error=exists`);
  }

  const { hashPassword } = await import("@/lib/auth/crypto");
  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: hashPassword(password),
      memberships: {
        create: {
          workspaceId: invite.workspaceId,
          role: invite.role,
        },
      },
    },
  });

  await prisma.workspaceInvite.update({
    where: { id: invite.id },
    data: { status: "ACCEPTED", acceptedAt: new Date() },
  });

  await createSession(user.id);
  redirect("/app");
}
