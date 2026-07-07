import type { ApplicationTabCounts, Job, JobApplication, JobTabCounts } from "@/lib/jobs/types";

const PRODUCT_DESIGNER_ABOUT =
  "We're looking for a product designer to own end-to-end design for our onboarding and activation experience. You'll partner closely with engineering and product to ship work that thousands of new users touch every week.";

const PRODUCT_DESIGNER_DUTIES = `Lead design for onboarding flows end to end
Run lightweight research and turn it into decisions
Partner with two engineers and a PM`;

export const MOCK_JOBS: Job[] = [
  {
    id: "job-pd",
    workspaceId: "dev-workspace",
    title: "Product Designer",
    department: "Design",
    employmentType: "Full-time",
    location: "Remote (EU)",
    salaryRange: "€65k – €85k",
    aboutRole: PRODUCT_DESIGNER_ABOUT,
    duties: PRODUCT_DESIGNER_DUTIES,
    status: "OPEN",
    publicSlug: "des-2f9",
    listOnCareersPage: true,
    applicationDeadline: new Date("2026-07-15"),
    applicationForm: {
      resumeEnabled: true,
      portfolioEnabled: true,
      phoneEnabled: false,
      customQuestions: [],
    },
    createdAt: new Date("2025-06-02"),
    publishedAt: new Date("2025-06-02"),
    closedAt: null,
  },
  {
    id: "job-fe",
    workspaceId: "dev-workspace",
    title: "Frontend Engineer",
    department: "Engineering",
    employmentType: "Full-time",
    location: "Hybrid (Toronto)",
    salaryRange: null,
    aboutRole: "Build polished recruiter and candidate experiences in React and TypeScript.",
    duties: "Ship features across the console\nImprove performance and accessibility\nCollaborate with design on interaction details",
    status: "OPEN",
    publicSlug: "fe-7a1",
    listOnCareersPage: true,
    applicationDeadline: new Date("2026-08-01"),
    applicationForm: {
      resumeEnabled: true,
      portfolioEnabled: true,
      phoneEnabled: false,
      customQuestions: [],
    },
    createdAt: new Date("2025-05-28"),
    publishedAt: new Date("2025-05-28"),
    closedAt: null,
  },
  {
    id: "job-cs",
    workspaceId: "dev-workspace",
    title: "Customer Success Lead",
    department: "Customer",
    employmentType: "Full-time",
    location: "Remote (Global)",
    salaryRange: null,
    aboutRole: "Own onboarding and retention for mid-market customers.",
    duties: "Lead a team of CSMs\nDesign playbooks for activation\nPartner with product on feedback loops",
    status: "OPEN",
    publicSlug: "cs-4b2",
    listOnCareersPage: false,
    applicationDeadline: new Date("2026-07-30"),
    applicationForm: {
      resumeEnabled: true,
      portfolioEnabled: false,
      phoneEnabled: true,
      customQuestions: [],
    },
    createdAt: new Date("2025-05-20"),
    publishedAt: new Date("2025-05-20"),
    closedAt: null,
  },
  {
    id: "job-da",
    workspaceId: "dev-workspace",
    title: "Data Analyst",
    department: "Data",
    employmentType: "Full-time",
    location: "Remote (EU)",
    salaryRange: null,
    aboutRole: "Turn hiring funnel data into decisions recruiters act on.",
    duties: "Build dashboards for recruiting teams\nPartner with eng on event instrumentation",
    status: "DRAFT",
    publicSlug: null,
    listOnCareersPage: false,
    applicationDeadline: null,
    applicationForm: {
      resumeEnabled: true,
      portfolioEnabled: false,
      phoneEnabled: false,
      customQuestions: [],
    },
    createdAt: new Date("2025-06-10"),
    publishedAt: null,
    closedAt: null,
  },
  {
    id: "job-mm",
    workspaceId: "dev-workspace",
    title: "Marketing Manager",
    department: "Marketing",
    employmentType: "Full-time",
    location: "Hybrid (Lisbon)",
    salaryRange: null,
    aboutRole: "Own demand gen and content for talent teams evaluating async video hiring.",
    duties: "Plan campaigns across email and social\nShip case studies with customers",
    status: "CLOSED",
    publicSlug: "mkt-9c1",
    listOnCareersPage: true,
    applicationDeadline: new Date("2025-05-05"),
    applicationForm: {
      resumeEnabled: true,
      portfolioEnabled: true,
      phoneEnabled: false,
      customQuestions: [],
    },
    createdAt: new Date("2025-04-01"),
    publishedAt: new Date("2025-04-01"),
    closedAt: new Date("2025-05-05"),
  },
];

export const MOCK_APPLICATIONS: JobApplication[] = [
  {
    id: "app-1",
    jobId: "job-pd",
    name: "Aanya Bhatt",
    email: "aanya.b@email.com",
    resumeUrl: "#",
    portfolioUrl: "#",
    phone: null,
    submittedAt: new Date(Date.now() - 2 * 3600000),
    stage: "APPLIED",
    inviteSentAt: null,
    avatarColor: "#1C6B47",
  },
  {
    id: "app-2",
    jobId: "job-pd",
    name: "Marcus Owens",
    email: "m.owens@email.com",
    resumeUrl: "#",
    portfolioUrl: "#",
    phone: null,
    submittedAt: new Date(Date.now() - 5 * 3600000),
    stage: "APPLIED",
    inviteSentAt: null,
    avatarColor: "#7A766C",
  },
  {
    id: "app-3",
    jobId: "job-pd",
    name: "Sofia Klein",
    email: "sofia.klein@email.com",
    resumeUrl: "#",
    portfolioUrl: null,
    phone: null,
    submittedAt: new Date(Date.now() - 8 * 3600000),
    stage: "APPLIED",
    inviteSentAt: null,
    avatarColor: "#5E6B60",
  },
  {
    id: "app-4",
    jobId: "job-pd",
    name: "Diego Rossi",
    email: "diego.rossi@email.com",
    resumeUrl: "#",
    portfolioUrl: "#",
    phone: null,
    submittedAt: new Date(Date.now() - 86400000),
    stage: "APPLIED",
    inviteSentAt: null,
    avatarColor: "#8A6F52",
  },
  {
    id: "app-5",
    jobId: "job-pd",
    name: "Nadia Amaru",
    email: "nadia.amaru@email.com",
    resumeUrl: "#",
    portfolioUrl: null,
    phone: null,
    submittedAt: new Date(Date.now() - 86400000),
    stage: "APPLIED",
    inviteSentAt: null,
    avatarColor: "#6B7775",
  },
  {
    id: "app-6",
    jobId: "job-pd",
    name: "Lena Hofer",
    email: "lena.hofer@email.com",
    resumeUrl: "#",
    portfolioUrl: "#",
    phone: null,
    submittedAt: new Date(Date.now() - 2 * 86400000),
    stage: "INVITED",
    inviteSentAt: new Date(Date.now() - 2 * 86400000),
    avatarColor: "#76746E",
  },
];

export function getMockJobTabCounts(): JobTabCounts {
  return {
    All: MOCK_JOBS.length,
    Open: MOCK_JOBS.filter((j) => j.status === "OPEN").length,
    Draft: MOCK_JOBS.filter((j) => j.status === "DRAFT").length,
    Closed: MOCK_JOBS.filter((j) => j.status === "CLOSED").length,
  };
}

export function getMockApplicationTabCounts(jobId: string): ApplicationTabCounts {
  const apps = MOCK_APPLICATIONS.filter((a) => a.jobId === jobId);
  return {
    Applied: apps.filter((a) => a.stage === "APPLIED").length + 56,
    Invited: apps.filter((a) => a.stage === "INVITED").length + 17,
    Interviewed: 6,
    Passed: 11,
  };
}

export function applicantCountForJob(jobId: string): number {
  if (jobId === "job-pd") return 86;
  if (jobId === "job-fe") return 63;
  if (jobId === "job-cs") return 41;
  if (jobId === "job-da") return 0;
  if (jobId === "job-mm") return 57;
  return MOCK_APPLICATIONS.filter((a) => a.jobId === jobId).length;
}

export function totalApplicantCount(): number {
  return MOCK_JOBS.reduce((sum, job) => sum + applicantCountForJob(job.id), 0);
}
