import { randomBytes } from "crypto";

function slugPrefix(title: string) {
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length >= 2) {
    return `${words[0]!.slice(0, 3)}${words[1]!.slice(0, 1)}`;
  }
  return (words[0] ?? "job").slice(0, 3);
}

export function generateJobSlug(title: string) {
  return `${slugPrefix(title)}-${randomBytes(2).toString("hex")}`;
}
