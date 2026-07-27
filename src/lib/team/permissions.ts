import type { WorkspaceRole } from "@prisma/client";

export function roleLabel(role: WorkspaceRole) {
  if (role === "ADMIN") return "Admin";
  return "Recruiter";
}

export function isAdmin(role: WorkspaceRole) {
  return role === "ADMIN";
}

export const INVITABLE_ROLES: WorkspaceRole[] = ["ADMIN", "RECRUITER"];
