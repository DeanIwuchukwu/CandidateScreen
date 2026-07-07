export function jobPublicPath(slug: string) {
  return `/p/${slug}`;
}

export function jobPublicUrl(slug: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${jobPublicPath(slug)}`;
}

export function jobPublicDisplayUrl(slug: string, careersHost = "careers.northwind.com") {
  return `${careersHost}/p/${slug}`;
}
