import { PrismaClient } from "@prisma/client";
import { scryptSync, randomBytes } from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const QUESTIONS = [
  "Tell us about a project you're proud of.",
  "How do you approach ambiguous problems?",
  "Describe a time you received tough feedback.",
  "What would your teammates say you do best?",
  "Why are you interested in this role?",
];

async function main() {
  const passwordHash = hashPassword("password123");

  await prisma.answer.deleteMany();
  await prisma.rubricRating.deleteMany();
  await prisma.candidateResponse.deleteMany();
  await prisma.jobApplication.deleteMany();
  await prisma.job.deleteMany();
  await prisma.invite.deleteMany();
  await prisma.question.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      email: "maya@northwind.com",
      name: "Maya Chen",
      passwordHash,
      memberships: {
        create: {
          role: "ADMIN",
          workspace: {
            create: {
              name: "Northwind",
              slug: "northwind",
              careersUrl: "https://northwind.example/careers",
            },
          },
        },
      },
    },
    include: { memberships: { include: { workspace: true } } },
  });

  const workspace = user.memberships[0]!.workspace;

  const interview = await prisma.interview.create({
    data: {
      workspaceId: workspace.id,
      ownerId: user.id,
      title: "Product Designer",
      status: "ACTIVE",
      welcomeMessage:
        "We loved your application — this is just a chance to hear how you think. Be yourself.",
      publishedAt: new Date(),
      questions: {
        create: QUESTIONS.map((text, order) => ({
          order,
          text,
          timeLimitSec: 120,
          retakes: 2,
          thinkTimeSec: 3,
        })),
      },
    },
    include: { questions: true },
  });

  await prisma.invite.create({
    data: {
      interviewId: interview.id,
      token: "demo-invite-token",
      candidateName: "Jordan Reyes",
      status: "PENDING",
      expiresAt: new Date(Date.now() + 7 * 86400000),
    },
  });

  const submittedInvite = await prisma.invite.create({
    data: {
      interviewId: interview.id,
      token: "review-demo-token",
      candidateName: "Priya Nair",
      status: "COMPLETED",
    },
  });

  const response = await prisma.candidateResponse.create({
    data: {
      inviteId: submittedInvite.id,
      stage: "TO_REVIEW",
      submittedAt: new Date(),
      progressPhase: "done",
    },
  });

  for (const q of interview.questions) {
    await prisma.answer.create({
      data: {
        responseId: response.id,
        questionId: q.id,
        durationSec: 95,
        transcript: `[Auto transcript] Response to: ${q.text.slice(0, 60)}…`,
        videoUrl: null,
      },
    });
  }

  const job = await prisma.job.create({
    data: {
      workspaceId: workspace.id,
      ownerId: user.id,
      title: "Product Designer",
      department: "Design",
      employmentType: "Full-time",
      location: "Remote (EU)",
      salaryRange: "€65k – €85k",
      aboutRole:
        "We're looking for a product designer to own end-to-end design for our onboarding and activation experience. You'll partner closely with engineering and product to ship work that thousands of new users touch every week.",
      duties:
        "Lead design for onboarding flows end to end\nRun lightweight research and turn it into decisions\nPartner with two engineers and a PM",
      status: "OPEN",
      publicSlug: "des-2f9",
      listOnCareersPage: true,
      applicationDeadline: new Date("2026-07-15"),
      resumeEnabled: true,
      portfolioEnabled: true,
      phoneEnabled: false,
      customQuestions: [],
      publishedAt: new Date("2025-06-02"),
    },
  });

  await prisma.interview.update({
    where: { id: interview.id },
    data: { jobId: job.id },
  });

  await prisma.jobApplication.createMany({
    data: [
      {
        jobId: job.id,
        name: "Aanya Bhatt",
        email: "aanya.b@email.com",
        resumeUrl: null,
        portfolioUrl: "https://example.com",
        stage: "APPLIED",
        submittedAt: new Date(Date.now() - 2 * 3600000),
      },
      {
        jobId: job.id,
        name: "Marcus Owens",
        email: "m.owens@email.com",
        resumeUrl: null,
        portfolioUrl: "https://example.com",
        stage: "APPLIED",
        submittedAt: new Date(Date.now() - 5 * 3600000),
      },
      {
        jobId: job.id,
        name: "Lena Hofer",
        email: "lena.hofer@email.com",
        resumeUrl: null,
        portfolioUrl: "https://example.com",
        stage: "INVITED",
        inviteSentAt: new Date(Date.now() - 2 * 86400000),
        submittedAt: new Date(Date.now() - 2 * 86400000),
      },
    ],
  });

  console.info("Seed complete");
  console.info("Login: maya@northwind.com / password123");
  console.info("Candidate invite: /i/demo-invite-token");
  console.info("Review: /app/candidates/" + response.id + "/review");
  console.info("Public job: /p/des-2f9");
  console.info("Job applicants: /app/jobs/" + job.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
