"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isDevBypass } from "@/lib/dev/bypass";
import { requireWorkspaceProduct } from "@/lib/workspace/product-actions";

export async function addEmployeeAction(formData: FormData) {
  const membership = await requireWorkspaceProduct("employees");
  if (membership.role === "VIEWER") {
    redirect("/app/employees?error=forbidden");
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!name || !email || !email.includes("@")) {
    redirect("/app/employees?error=invalid");
  }

  if (isDevBypass()) {
    revalidatePath("/app/employees");
    redirect("/app/employees");
  }

  try {
    await prisma.employee.create({
      data: {
        workspaceId: membership.workspace.id,
        name,
        email,
      },
    });
  } catch {
    redirect("/app/employees?error=duplicate");
  }

  revalidatePath("/app/employees");
  redirect("/app/employees");
}

export async function removeEmployeeAction(formData: FormData) {
  const membership = await requireWorkspaceProduct("employees");
  if (membership.role === "VIEWER") {
    redirect("/app/employees?error=forbidden");
  }

  const employeeId = String(formData.get("employeeId") ?? "");
  if (!employeeId) redirect("/app/employees");

  if (isDevBypass()) {
    revalidatePath("/app/employees");
    redirect("/app/employees");
  }

  await prisma.employee.deleteMany({
    where: { id: employeeId, workspaceId: membership.workspace.id },
  });

  revalidatePath("/app/employees");
  redirect("/app/employees");
}
