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

export function formatCompactRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1d ago";
  return `${days}d ago`;
}

export function formatJobMeta(job: {
  department: string;
  location: string;
  employmentType: string;
  status: string;
  publishedAt: Date | null;
  closedAt: Date | null;
}): string {
  const parts = [job.department, job.location, job.employmentType];
  if (job.status === "DRAFT") {
    return `${parts.join(" · ")} · Not published`;
  }
  if (job.status === "CLOSED" && job.closedAt) {
    const closed = job.closedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${parts.join(" · ")} · Closed ${closed}`;
  }
  if (job.publishedAt) {
    const posted = job.publishedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${parts.join(" · ")} · Posted ${posted}`;
  }
  return parts.join(" · ");
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
