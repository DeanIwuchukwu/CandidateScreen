import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getAppOrigin } from "@/lib/app-origin";
import { prisma } from "@/lib/db";
import { isDevBypass } from "@/lib/dev/bypass";

const SESSION_COOKIE = "cs_session";

export async function POST(request: NextRequest) {
  if (!isDevBypass()) {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (token) {
      await prisma.session.deleteMany({ where: { token } });
      cookieStore.delete(SESSION_COOKIE);
    }
  }

  return NextResponse.redirect(new URL("/login", `${getAppOrigin(request)}/`));
}
