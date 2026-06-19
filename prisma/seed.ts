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

  console.info("Seed complete");
  console.info("Login: maya@northwind.com / password123");
  console.info("Candidate invite: /i/demo-invite-token");
  console.info("Review: /app/candidates/" + response.id + "/review");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
