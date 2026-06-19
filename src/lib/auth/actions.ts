"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createToken, hashPassword, verifyPassword } from "@/lib/auth/crypto";
import { createSession, destroySession } from "@/lib/auth/session";
import { isDevBypass } from "@/lib/dev/bypass";

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

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
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

  if (process.env.NODE_ENV === "development") {
    console.info(
      `[password-reset] ${parsed.data.email} → ${process.env.NEXT_PUBLIC_APP_URL}/reset/${token}`,
    );
  }

  redirect("/reset?sent=1");
}
