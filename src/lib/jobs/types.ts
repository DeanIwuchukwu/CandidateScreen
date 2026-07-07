export type JobStatus = "OPEN" | "DRAFT" | "CLOSED";

export type ApplicationStage = "APPLIED" | "INVITED" | "INTERVIEWED" | "PASSED";

export type JobApplicationFormConfig = {
  resumeEnabled: boolean;
  portfolioEnabled: boolean;
  phoneEnabled: boolean;
  customQuestions: string[];
};

export type Job = {
  id: string;
  workspaceId: string;
  title: string;
  department: string;
  employmentType: string;
  location: string;
  salaryRange: string | null;
  aboutRole: string;
  duties: string;
  status: JobStatus;
  publicSlug: string | null;
  listOnCareersPage: boolean;
  applicationDeadline: Date | null;
  applicationForm: JobApplicationFormConfig;
  createdAt: Date;
  publishedAt: Date | null;
  closedAt: Date | null;
};

export type JobApplication = {
  id: string;
  jobId: string;
  name: string;
  email: string;
  resumeUrl: string | null;
  portfolioUrl: string | null;
  phone: string | null;
  submittedAt: Date;
  stage: ApplicationStage;
  inviteSentAt: Date | null;
  avatarColor: string;
};

export type JobTabCounts = {
  All: number;
  Open: number;
  Draft: number;
  Closed: number;
};

export type ApplicationTabCounts = {
  Applied: number;
  Invited: number;
  Interviewed: number;
  Passed: number;
};
