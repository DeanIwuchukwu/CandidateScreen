export function formatInterviewMeta(
  status: string,
  createdAt: Date,
  updatedAt: Date,
  questionCount: number,
): string {
  if (status === "CLOSED") {
    return `${questionCount} questions · closed ${createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  }
  if (status === "DRAFT") {
    const days = Math.floor((Date.now() - updatedAt.getTime()) / 86400000);
    return `${questionCount} questions · last edited ${days}d ago`;
  }
  return `${questionCount} questions · created ${createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}
