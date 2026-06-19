import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isDevBypass } from "@/lib/dev/bypass";
import { MOCK_USER } from "@/lib/dev/mock-data";

const SESSION_COOKIE = "cs_session";
const SESSION_DAYS = 30;

export async function createSession(userId: string) {
  if (isDevBypass()) return;

  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

  await prisma.session.create({
    data: { userId, token, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function destroySession() {
  if (isDevBypass()) {
    redirect("/app");
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
    cookieStore.delete(SESSION_COOKIE);
  }
}

export async function getSessionUser() {
  if (isDevBypass()) return MOCK_USER;

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      memberships: {
        include: { workspace: true },
        take: 1,
      },
    },
  });

  return user;
}

export async function requireSessionUser() {
  if (isDevBypass()) return MOCK_USER;

  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
