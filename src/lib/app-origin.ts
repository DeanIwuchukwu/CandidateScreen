import type { NextRequest } from "next/server";

/** Public site origin for redirects and links behind reverse proxies (Railway, etc.). */
export function getAppOrigin(request?: NextRequest) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configured) return configured;

  if (request) {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    if (host) return `${proto}://${host}`;
  }

  return request?.nextUrl.origin ?? "http://localhost:3000";
}
