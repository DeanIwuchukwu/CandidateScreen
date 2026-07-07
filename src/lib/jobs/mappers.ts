import type { Job as PrismaJob, JobApplication as PrismaJobApplication } from "@prisma/client";
import { avatarColorForName } from "@/lib/jobs/avatar";
import type { Job, JobApplication, JobApplicationFormConfig } from "@/lib/jobs/types";

function parseCustomQuestions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function mapJob(row: PrismaJob): Job {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    title: row.title,
    department: row.department,
    employmentType: row.employmentType,
    location: row.location,
    salaryRange: row.salaryRange,
    aboutRole: row.aboutRole,
    duties: row.duties,
    status: row.status,
    publicSlug: row.publicSlug,
    listOnCareersPage: row.listOnCareersPage,
    applicationDeadline: row.applicationDeadline,
    applicationForm: {
      resumeEnabled: row.resumeEnabled,
      portfolioEnabled: row.portfolioEnabled,
      phoneEnabled: row.phoneEnabled,
      customQuestions: parseCustomQuestions(row.customQuestions),
    },
    createdAt: row.createdAt,
    publishedAt: row.publishedAt,
    closedAt: row.closedAt,
  };
}

export function mapApplication(row: PrismaJobApplication): JobApplication {
  return {
    id: row.id,
    jobId: row.jobId,
    name: row.name,
    email: row.email,
    resumeUrl: row.resumeUrl,
    portfolioUrl: row.portfolioUrl,
    phone: row.phone,
    submittedAt: row.submittedAt,
    stage: row.stage,
    inviteSentAt: row.inviteSentAt,
    avatarColor: avatarColorForName(row.name),
  };
}

export function formConfigToDb(form: JobApplicationFormConfig) {
  return {
    resumeEnabled: form.resumeEnabled,
    portfolioEnabled: form.portfolioEnabled,
    phoneEnabled: form.phoneEnabled,
    customQuestions: form.customQuestions,
  };
}
