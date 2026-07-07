const AVATAR_COLORS = [
  "#1C6B47",
  "#2A6FDB",
  "#B5503D",
  "#6B4E8A",
  "#7A766C",
  "#5E6B60",
  "#8A6F52",
];

export function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

export function avatarColorForEmail(email: string) {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
}

export function memberAvatar(name: string, email: string) {
  return {
    initials: initialsFromName(name),
    color: avatarColorForEmail(email),
  };
}
