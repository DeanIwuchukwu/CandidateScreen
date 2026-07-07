import { prisma } from "@/lib/db";
import { isDevBypass } from "@/lib/dev/bypass";
import { mapApplication, mapJob } from "@/lib/jobs/mappers";
import {
  MOCK_APPLICATIONS,
  MOCK_JOBS,
  applicantCountForJob,
  getMockApplicationTabCounts,
  getMockJobTabCounts,
  totalApplicantCount,
} from "@/lib/jobs/mock-data";
import type {
  ApplicationStage,
  ApplicationTabCounts,
  Job,
  JobApplication,
  JobStatus,
  JobTabCounts,
} from "@/lib/jobs/types";

export async function getJobs(workspaceId: string, status?: JobStatus): Promise<Job[]> {
  if (isDevBypass()) {
    let jobs = [...MOCK_JOBS];
    if (status) jobs = jobs.filter((j) => j.status === status);
    return jobs.sort(
      (a, b) =>
        (b.publishedAt ?? b.createdAt).getTime() - (a.publishedAt ?? a.createdAt).getTime(),
    );
  }

  const rows = await prisma.job.findMany({
    where: {
      workspaceId,
      ...(status ? { status } : {}),
    },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
  });
  return rows.map(mapJob);
}

export type JobRoleOption = {
  id: string;
  title: string;
  department: string;
  location: string;
  status: JobStatus;
  statusLabel: string;
  publicSlug: string | null;
};

function jobStatusLabel(status: JobStatus) {
  return status === "OPEN" ? "Open" : status === "DRAFT" ? "Draft" : "Closed";
}

export async function getJobsForRolePicker(workspaceId: string): Promise<JobRoleOption[]> {
  if (isDevBypass()) {
    return MOCK_JOBS.filter((j) => j.status === "OPEN" || j.status === "DRAFT").map((job) => ({
      id: job.id,
      title: job.title,
      department: job.department,
      location: job.location,
      status: job.status,
      statusLabel: jobStatusLabel(job.status),
      publicSlug: job.publicSlug,
    }));
  }

  const rows = await prisma.job.findMany({
    where: { workspaceId, status: { in: ["OPEN", "DRAFT"] } },
    orderBy: [{ status: "asc" }, { title: "asc" }],
  });

  return rows.map((job) => ({
    id: job.id,
    title: job.title,
    department: job.department,
    location: job.location,
    status: job.status,
    statusLabel: jobStatusLabel(job.status),
    publicSlug: job.publicSlug,
  }));
}

export type InterviewInviteOption = {
  id: string;
  title: string;
  questionCount: number;
  totalMin: number;
  retakes: number;
  jobId: string | null;
};

export async function getJobTabCounts(workspaceId: string): Promise<JobTabCounts> {
  if (isDevBypass()) return getMockJobTabCounts();

  const [all, open, draft, closed] = await Promise.all([
    prisma.job.count({ where: { workspaceId } }),
    prisma.job.count({ where: { workspaceId, status: "OPEN" } }),
    prisma.job.count({ where: { workspaceId, status: "DRAFT" } }),
    prisma.job.count({ where: { workspaceId, status: "CLOSED" } }),
  ]);
  return { All: all, Open: open, Draft: draft, Closed: closed };
}

export async function getJobsSummary(workspaceId: string) {
  if (isDevBypass()) {
    const counts = getMockJobTabCounts();
    return {
      totalListings: counts.All,
      openListings: counts.Open,
      totalApplicants: totalApplicantCount(),
    };
  }

  const [totalListings, openListings, totalApplicants] = await Promise.all([
    prisma.job.count({ where: { workspaceId } }),
    prisma.job.count({ where: { workspaceId, status: "OPEN" } }),
    prisma.jobApplication.count({ where: { job: { workspaceId } } }),
  ]);
  return { totalListings, openListings, totalApplicants };
}

export async function getJobById(workspaceId: string, jobId: string): Promise<Job | null> {
  if (isDevBypass()) {
    return MOCK_JOBS.find((j) => j.id === jobId) ?? null;
  }

  const row = await prisma.job.findFirst({
    where: { id: jobId, workspaceId },
  });
  return row ? mapJob(row) : null;
}

export async function getJobBySlug(
  slug: string,
): Promise<(Job & { workspaceName: string }) | null> {
  if (isDevBypass()) {
    const job = MOCK_JOBS.find((j) => j.publicSlug === slug && j.status === "OPEN");
    return job ? { ...job, workspaceName: "Northwind" } : null;
  }

  const row = await prisma.job.findFirst({
    where: { publicSlug: slug, status: "OPEN" },
    include: { workspace: true },
  });
  if (!row) return null;
  return { ...mapJob(row), workspaceName: row.workspace.name };
}

export async function getJobApplicantCount(jobId: string): Promise<number> {
  if (isDevBypass()) return applicantCountForJob(jobId);
  return prisma.jobApplication.count({ where: { jobId } });
}

export async function getApplicationTabCounts(jobId: string): Promise<ApplicationTabCounts> {
  if (isDevBypass()) return getMockApplicationTabCounts(jobId);

  const [applied, invited, interviewed, passed] = await Promise.all([
    prisma.jobApplication.count({ where: { jobId, stage: "APPLIED" } }),
    prisma.jobApplication.count({ where: { jobId, stage: "INVITED" } }),
    prisma.jobApplication.count({ where: { jobId, stage: "INTERVIEWED" } }),
    prisma.jobApplication.count({ where: { jobId, stage: "PASSED" } }),
  ]);
  return { Applied: applied, Invited: invited, Interviewed: interviewed, Passed: passed };
}

export async function getJobApplications(
  jobId: string,
  stage?: ApplicationStage,
): Promise<JobApplication[]> {
  if (isDevBypass()) {
    let apps = MOCK_APPLICATIONS.filter((a) => a.jobId === jobId);
    if (stage) apps = apps.filter((a) => a.stage === stage);
    return apps.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
  }

  const rows = await prisma.jobApplication.findMany({
    where: { jobId, ...(stage ? { stage } : {}) },
    orderBy: { submittedAt: "desc" },
  });
  return rows.map(mapApplication);
}

export async function getInterviewInviteOptions(
  workspaceId: string,
): Promise<InterviewInviteOption[]> {
  if (isDevBypass()) {
    return [
      {
        id: "demo-interview",
        title: "Product Designer",
        questionCount: 5,
        totalMin: 10,
        retakes: 2,
        jobId: "job-pd",
      },
    ];
  }

  const interviews = await prisma.interview.findMany({
    where: { workspaceId, status: { in: ["ACTIVE", "DRAFT"] } },
    include: { questions: true },
    orderBy: { updatedAt: "desc" },
  });

  return interviews.map((interview) => {
    const totalSec = interview.questions.reduce((s, q) => s + q.timeLimitSec, 0);
    const retakes = interview.questions[0]?.retakes ?? 2;
    return {
      id: interview.id,
      title: interview.title,
      questionCount: interview.questions.length,
      totalMin: Math.max(1, Math.round(totalSec / 60)),
      retakes,
      jobId: interview.jobId,
    };
  });
}
