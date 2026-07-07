const AVATAR_COLORS = [
  "#1C6B47",
  "#7A766C",
  "#5E6B60",
  "#8A6F52",
  "#6B7775",
  "#76746E",
  "#5A6B8A",
  "#8A5A52",
];

export function avatarColorForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
}
