"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth/session";
import { getUserWorkspace } from "@/lib/recruiter/queries";
import { isAdmin } from "@/lib/team/permissions";
import { isDevBypass } from "@/lib/dev/bypass";
import { MOCK_USER } from "@/lib/dev/mock-data";
import {
  hasProduct,
  isWorkspaceProductId,
  type WorkspaceProductId,
} from "@/lib/workspace/products";

function bypassWorkspace() {
  return MOCK_USER.memberships[0]!.workspace;
}

async function requireAdminWorkspace() {
  const user = await requireSessionUser();
  const membership = await getUserWorkspace(user.id);
  if (!isAdmin(membership.role)) {
    redirect("/app/settings/products?error=forbidden");
  }
  return membership;
}

export async function enableProductAction(productId: string) {
  if (!isWorkspaceProductId(productId)) {
    redirect("/app/settings/products?error=invalid");
  }

  if (isDevBypass()) {
    const workspace = bypassWorkspace();
    if (!workspace.enabledProducts.includes(productId)) {
      workspace.enabledProducts.push(productId);
    }
    revalidatePath("/app");
    revalidatePath("/app/settings/products");
    redirect("/app/settings/products");
  }

  const { workspace } = await requireAdminWorkspace();
  if (hasProduct(workspace.enabledProducts, productId)) {
    redirect("/app/settings/products");
  }

  await prisma.workspace.update({
    where: { id: workspace.id },
    data: {
      enabledProducts: { push: productId },
    },
  });

  revalidatePath("/app");
  revalidatePath("/app/settings/products");
  redirect("/app/settings/products");
}

export async function disableProductAction(productId: string) {
  if (!isWorkspaceProductId(productId)) {
    redirect("/app/settings/products?error=invalid");
  }

  if (isDevBypass()) {
    const workspace = bypassWorkspace();
    workspace.enabledProducts = workspace.enabledProducts.filter(
      (id) => id !== productId,
    );
    revalidatePath("/app");
    revalidatePath("/app/settings/products");
    redirect("/app/settings/products");
  }

  const { workspace } = await requireAdminWorkspace();
  const next = workspace.enabledProducts.filter((id) => id !== productId);

  await prisma.workspace.update({
    where: { id: workspace.id },
    data: { enabledProducts: next },
  });

  revalidatePath("/app");
  revalidatePath("/app/settings/products");
  redirect("/app/settings/products");
}

export async function setProductEnabledAction(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  const intent = String(formData.get("intent") ?? "");
  if (!isWorkspaceProductId(productId)) {
    redirect("/app/settings/products?error=invalid");
  }

  if (intent === "enable") {
    await enableProductAction(productId);
    return;
  }
  if (intent === "disable") {
    await disableProductAction(productId);
    return;
  }
  redirect("/app/settings/products");
}

export async function requireWorkspaceProduct(productId: WorkspaceProductId) {
  const user = await requireSessionUser();
  const membership = await getUserWorkspace(user.id);
  if (!hasProduct(membership.workspace.enabledProducts, productId)) {
    redirect("/app/settings/products");
  }
  return membership;
}
