"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth/session";
import { getUserWorkspace } from "@/lib/recruiter/queries";
import { ensureCandidateResponse } from "@/lib/candidate/invite";
import {
  firstNameFromFullName,
  estimateInterviewMinutes,
  mergeInviteMessage,
  sendInterviewInviteEmail,
} from "@/lib/email";
import { formConfigToDb } from "@/lib/jobs/mappers";
import { generateJobSlug } from "@/lib/jobs/slug";
import { jobPublicUrl } from "@/lib/jobs/urls";
import type { JobListingFormValues } from "@/components/recruiter/job-listing-form";
import { isDevBypass } from "@/lib/dev/bypass";
import { saveResume } from "@/lib/storage";

async function workspaceGuard() {
  const user = await requireSessionUser();
  const { workspace, role } = await getUserWorkspace(user.id);
  return { user, workspace, role };
}

function jobDataFromValues(values: JobListingFormValues, ownerId: string, workspaceId: string) {
  const form = formConfigToDb(values.applicationForm);
  return {
    ownerId,
    workspaceId,
    title: values.title.trim() || "Untitled role",
    department: values.department,
    employmentType: values.employmentType,
    location: values.location.trim(),
    salaryRange: values.salaryRange.trim() || null,
    aboutRole: values.aboutRole.trim(),
    duties: values.duties.trim(),
    listOnCareersPage: values.listOnCareersPage,
    applicationDeadline: values.applicationDeadline
      ? new Date(values.applicationDeadline)
      : null,
    ...form,
  };
}

export async function saveJobDraftAction(
  jobId: string | null,
  values: JobListingFormValues,
): Promise<{ ok: true; jobId: string } | { ok: false; error: string }> {
  if (isDevBypass()) {
    return { ok: true, jobId: jobId ?? "job-pd" };
  }

  const { user, workspace } = await workspaceGuard();
  const data = jobDataFromValues(values, user.id, workspace.id);

  if (jobId) {
    const existing = await prisma.job.findFirst({
      where: { id: jobId, workspaceId: workspace.id },
    });
    if (!existing) return { ok: false, error: "not_found" };

    await prisma.job.update({
      where: { id: jobId },
      data: { ...data, status: existing.status === "OPEN" ? "OPEN" : "DRAFT" },
    });
    revalidatePath("/app/jobs");
    revalidatePath(`/app/jobs/${jobId}`);
    revalidatePath(`/app/jobs/${jobId}/edit`);
    return { ok: true, jobId };
  }

  const job = await prisma.job.create({
    data: { ...data, status: "DRAFT" },
  });
  revalidatePath("/app/jobs");
  return { ok: true, jobId: job.id };
}

export async function publishJobAction(
  jobId: string | null,
  values: JobListingFormValues,
): Promise<
  | { ok: true; jobId: string; publicSlug: string; publicUrl: string }
  | { ok: false; error: string }
> {
  if (isDevBypass()) {
    const slug = "des-2f9";
    return { ok: true, jobId: jobId ?? "job-pd", publicSlug: slug, publicUrl: jobPublicUrl(slug) };
  }

  const { user, workspace } = await workspaceGuard();
  const data = jobDataFromValues(values, user.id, workspace.id);
  const now = new Date();

  if (jobId) {
    const existing = await prisma.job.findFirst({
      where: { id: jobId, workspaceId: workspace.id },
    });
    if (!existing) return { ok: false, error: "not_found" };

    const publicSlug = existing.publicSlug ?? generateJobSlug(data.title);
    const job = await prisma.job.update({
      where: { id: jobId },
      data: {
        ...data,
        status: "OPEN",
        publicSlug,
        publishedAt: existing.publishedAt ?? now,
        closedAt: null,
      },
    });
    revalidatePath("/app/jobs");
    revalidatePath(`/app/jobs/${jobId}`);
    revalidatePath(`/app/jobs/${jobId}/edit`);
    revalidatePath(`/p/${job.publicSlug}`);
    return {
      ok: true,
      jobId: job.id,
      publicSlug: job.publicSlug!,
      publicUrl: jobPublicUrl(job.publicSlug!),
    };
  }

  const publicSlug = generateJobSlug(data.title);
  const job = await prisma.job.create({
    data: {
      ...data,
      status: "OPEN",
      publicSlug,
      publishedAt: now,
    },
  });
  revalidatePath("/app/jobs");
  revalidatePath(`/p/${job.publicSlug}`);
  return {
    ok: true,
    jobId: job.id,
    publicSlug: job.publicSlug!,
    publicUrl: jobPublicUrl(job.publicSlug!),
  };
}

export async function submitJobApplicationAction(
  slug: string,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isDevBypass()) return { ok: true };

  const job = await prisma.job.findFirst({
    where: { publicSlug: slug, status: "OPEN" },
  });
  if (!job) return { ok: false, error: "not_found" };

  if (job.applicationDeadline && job.applicationDeadline < new Date()) {
    return { ok: false, error: "deadline_passed" };
  }

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!name || !email) return { ok: false, error: "missing_required" };

  const portfolioUrl = String(formData.get("portfolioUrl") || "").trim() || null;
  const phone = String(formData.get("phone") || "").trim() || null;

  const existing = await prisma.jobApplication.findUnique({
    where: { jobId_email: { jobId: job.id, email } },
  });
  if (existing) return { ok: false, error: "already_applied" };

  const application = await prisma.jobApplication.create({
    data: {
      jobId: job.id,
      name,
      email,
      portfolioUrl: job.portfolioEnabled ? portfolioUrl : null,
      phone: job.phoneEnabled ? phone : null,
      stage: "APPLIED",
    },
  });

  if (job.resumeEnabled) {
    const file = formData.get("resume") as File | null;
    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const resumeUrl = await saveResume(application.id, file.name, buffer);
      await prisma.jobApplication.update({
        where: { id: application.id },
        data: { resumeUrl },
      });
    }
  }

  const customAnswers: Record<string, string> = {};
  const questions = Array.isArray(job.customQuestions)
    ? (job.customQuestions as string[])
    : [];
  for (let i = 0; i < questions.length; i++) {
    const answer = String(formData.get(`custom_${i}`) || "").trim();
    if (answer) customAnswers[String(i)] = answer;
  }
  if (Object.keys(customAnswers).length > 0) {
    await prisma.jobApplication.update({
      where: { id: application.id },
      data: { customAnswers },
    });
  }

  revalidatePath(`/app/jobs/${job.id}`);
  revalidatePath(`/p/${slug}`);
  return { ok: true };
}

export async function sendInterviewInvitesAction(input: {
  applicationIds: string[];
  interviewId: string;
  deadlineDays: number;
  message: string;
}): Promise<{ ok: true; sent: number } | { ok: false; error: string }> {
  if (isDevBypass()) return { ok: true, sent: input.applicationIds.length };

  const { user, workspace } = await workspaceGuard();

  const interview = await prisma.interview.findFirst({
    where: { id: input.interviewId, workspaceId: workspace.id },
    include: { questions: true },
  });
  if (!interview) return { ok: false, error: "interview_not_found" };

  const applications = await prisma.jobApplication.findMany({
    where: {
      id: { in: input.applicationIds },
      stage: "APPLIED",
      job: { workspaceId: workspace.id },
    },
    include: { job: true },
  });

  if (applications.length === 0) return { ok: false, error: "no_applicants" };

  const respondBy = new Date(Date.now() + input.deadlineDays * 86400000);
  const appBase = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  let sent = 0;

  for (const application of applications) {
    const invite = await prisma.invite.create({
      data: {
        interviewId: interview.id,
        email: application.email,
        candidateName: application.name,
        expiresAt: respondBy,
      },
    });

    await ensureCandidateResponse(invite.id);

    await prisma.jobApplication.update({
      where: { id: application.id },
      data: {
        stage: "INVITED",
        inviteId: invite.id,
        inviteSentAt: new Date(),
        interviewId: interview.id,
        respondBy,
        senderUserId: user.id,
      },
    });

    const firstName = firstNameFromFullName(application.name);
    const body = mergeInviteMessage(input.message, firstName);
    const inviteUrl = `${appBase.replace(/\/$/, "")}/i/${invite.token}`;

    await sendInterviewInviteEmail({
      to: application.email,
      candidateName: application.name,
      jobTitle: application.job.title,
      message: body,
      inviteUrl,
      senderName: user.name,
      workspaceName: workspace.name,
      questionCount: interview.questions.length,
      deadlineDays: input.deadlineDays,
      allowRetakes: interview.allowRetakes,
      estimatedMinutes: estimateInterviewMinutes(interview.questions),
    });

    sent++;
  }

  const jobIds = [...new Set(applications.map((a) => a.jobId))];
  revalidatePath("/app/jobs");
  revalidatePath("/app/candidates");
  for (const jobId of jobIds) {
    revalidatePath(`/app/jobs/${jobId}`);
  }

  return { ok: true, sent };
}
