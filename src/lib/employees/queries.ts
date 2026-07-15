import { prisma } from "@/lib/db";
import { isDevBypass } from "@/lib/dev/bypass";

export async function getEmployees(workspaceId: string) {
  if (isDevBypass()) return [];
  return prisma.employee.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });
}
