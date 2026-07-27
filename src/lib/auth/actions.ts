"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createToken, hashPassword, verifyPassword } from "@/lib/auth/crypto";
import { createSession, destroySession, requireSessionUser } from "@/lib/auth/session";
import { isDevBypass } from "@/lib/dev/bypass";
import { sendPasswordResetEmail, sendWelcomeEmail } from "@/lib/email";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const registerSchema = z.object({
  name: z.string().min(2),
  company: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

const resetRequestSchema = z.object({
  email: z.string().email(),
});

const completeResetSchema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function loginAction(formData: FormData): Promise<void> {
  if (isDevBypass()) redirect("/app");
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect("/login?error=invalid");
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    redirect("/login?error=invalid");
  }

  await createSession(user.id);

  const next = String(formData.get("next") || "").trim();
  if (next && next.startsWith("/")) {
    redirect(next);
  }

  redirect("/app");
}

export async function registerAction(formData: FormData): Promise<void> {
  if (isDevBypass()) redirect("/app");
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    company: formData.get("company"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect("/register?error=invalid");
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    redirect("/register?error=exists");
  }

  const baseSlug = slugify(parsed.data.company);
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.workspace.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix++}`;
  }

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      passwordHash: hashPassword(parsed.data.password),
      memberships: {
        create: {
          role: "ADMIN",
          workspace: {
            create: {
              name: parsed.data.company,
              slug,
            },
          },
        },
      },
    },
  });

  await sendWelcomeEmail({
    to: user.email,
    name: parsed.data.name,
    companyName: parsed.data.company,
  }).catch((err) => console.error("[email] welcome failed", err));

  await createSession(user.id);
  redirect("/app");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}

export async function requestPasswordResetAction(formData: FormData): Promise<void> {
  const parsed = resetRequestSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    redirect("/reset?error=invalid");
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  if (user) {
    const token = createToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await prisma.passwordReset.deleteMany({ where: { email: parsed.data.email } });
    await prisma.passwordReset.create({
      data: {
        email: parsed.data.email,
        token,
        expiresAt,
      },
    });

    const resetUrl = `${appUrl()}/reset/${token}`;
    void sendPasswordResetEmail({ to: parsed.data.email, resetUrl }).catch((err) =>
      console.error("[email] password reset failed", err),
    );
  }

  redirect("/reset?sent=1");
}

export async function completePasswordResetAction(
  token: string,
  formData: FormData,
): Promise<void> {
  const parsed = completeResetSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success || parsed.data.password !== parsed.data.confirmPassword) {
    redirect(`/reset/${token}?error=invalid`);
  }

  const reset = await prisma.passwordReset.findUnique({ where: { token } });
  if (!reset || reset.expiresAt < new Date()) {
    redirect(`/reset/${token}?error=expired`);
  }

  const user = await prisma.user.findUnique({ where: { email: reset.email } });
  if (!user) {
    redirect(`/reset/${token}?error=expired`);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(parsed.data.password) },
  });
  await prisma.passwordReset.delete({ where: { id: reset.id } });

  redirect("/login?reset=success");
}

export async function changePasswordAction(formData: FormData): Promise<void> {
  if (isDevBypass()) {
    redirect("/app/settings/password?saved=1");
  }

  const user = await requireSessionUser();
  const currentPassword = String(formData.get("currentPassword") || "");
  const parsed = completeResetSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    redirect("/app/settings/password?error=invalid");
  }
  if (parsed.data.password !== parsed.data.confirmPassword) {
    redirect("/app/settings/password?error=mismatch");
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || !verifyPassword(currentPassword, dbUser.passwordHash)) {
    redirect("/app/settings/password?error=current");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(parsed.data.password) },
  });

  redirect("/app/settings/password?saved=1");
}
