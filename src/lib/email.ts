import { Resend } from "resend";
import { EMAIL_FROM_FALLBACK, PRODUCT_NAME, PRODUCT_TAGLINE } from "@/lib/brand";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

type InviteEmailPayload = {
  to: string;
  candidateName: string;
  jobTitle: string;
  message: string;
  inviteUrl: string;
  senderName: string;
};

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resendClient) resendClient = new Resend(apiKey);
  return resendClient;
}

function emailFrom() {
  return process.env.EMAIL_FROM ?? EMAIL_FROM_FALLBACK;
}

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function emailLayout(content: string) {
  return `<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1a2b22; max-width: 560px; margin: 0 auto; padding: 24px;">
  <div style="margin-bottom: 24px; font-size: 18px; font-weight: 600; color: #1C6B47;">${PRODUCT_NAME}</div>
  ${content}
  <p style="margin-top: 32px; font-size: 12px; color: #6b7c72;">${PRODUCT_NAME} · ${PRODUCT_TAGLINE}</p>
</body>
</html>`;
}

async function sendEmail(input: SendEmailInput) {
  const client = getResendClient();
  if (!client) {
    console.info("[email]", { to: input.to, subject: input.subject, text: input.text });
    return { ok: true as const };
  }

  const { error } = await client.emails.send({
    from: emailFrom(),
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  if (error) {
    console.error("[email] send failed", error);
    return { ok: false as const, error: error.message };
  }

  return { ok: true as const };
}

export async function sendWelcomeEmail(input: {
  to: string;
  name: string;
  companyName: string;
}) {
  const dashboardUrl = `${appUrl()}/app`;
  const subject = `Welcome to ${PRODUCT_NAME}`;
  const text = `Hi ${input.name},

Welcome to ${PRODUCT_NAME}! Your workspace for ${input.companyName} is ready.

Open your dashboard: ${dashboardUrl}

— The ${PRODUCT_NAME} team`;

  const html = emailLayout(`
    <p>Hi ${input.name},</p>
    <p>Welcome to <strong>${PRODUCT_NAME}</strong>! Your workspace for <strong>${input.companyName}</strong> is ready.</p>
    <p style="margin: 28px 0;">
      <a href="${dashboardUrl}" style="display: inline-block; background: #1C6B47; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600;">Open your dashboard</a>
    </p>
    <p style="color: #4a5c52;">Create interviews, publish job listings, and review candidate responses — all in one place.</p>
  `);

  return sendEmail({ to: input.to, subject, html, text });
}

export async function sendPasswordResetEmail(input: { to: string; resetUrl: string }) {
  const subject = `Reset your ${PRODUCT_NAME} password`;
  const text = `Reset your password using this link (expires in 1 hour):

${input.resetUrl}

If you didn't request this, you can ignore this email.`;

  const html = emailLayout(`
    <p>You requested a password reset for your ${PRODUCT_NAME} account.</p>
    <p style="margin: 28px 0;">
      <a href="${input.resetUrl}" style="display: inline-block; background: #1C6B47; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600;">Reset password</a>
    </p>
    <p style="color: #6b7c72; font-size: 14px;">This link expires in 1 hour. If you didn't request a reset, you can safely ignore this email.</p>
  `);

  return sendEmail({ to: input.to, subject, html, text });
}

export async function sendTeamInviteEmail(input: {
  to: string;
  inviterName: string;
  workspaceName: string;
  role: string;
  joinUrl: string;
}) {
  const roleLabel = input.role === "ADMIN" ? "Admin" : "Recruiter";
  const subject = `Join ${input.workspaceName} on ${PRODUCT_NAME}`;
  const text = `${input.inviterName} invited you to join ${input.workspaceName} as ${roleLabel}.

Accept the invite: ${input.joinUrl}

This link expires in 7 days.`;

  const html = emailLayout(`
    <p><strong>${input.inviterName}</strong> invited you to join <strong>${input.workspaceName}</strong> on <strong>${PRODUCT_NAME}</strong> as <strong>${roleLabel}</strong>.</p>
    <p style="margin: 28px 0;">
      <a href="${input.joinUrl}" style="display: inline-block; background: #1C6B47; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600;">Accept invite</a>
    </p>
    <p style="color: #6b7c72; font-size: 14px;">This link expires in 7 days.</p>
  `);

  return sendEmail({ to: input.to, subject, html, text });
}

export async function sendInterviewInviteEmail(payload: InviteEmailPayload) {
  const subject = `Video interview invitation — ${payload.jobTitle}`;
  const text = `${payload.message}\n\nRecord your interview: ${payload.inviteUrl}\n\n— ${payload.senderName} via ${PRODUCT_NAME}`;

  const html = emailLayout(`
    <p style="white-space: pre-wrap;">${payload.message.replace(/\n/g, "<br>")}</p>
    <p style="margin: 28px 0;">
      <a href="${payload.inviteUrl}" style="display: inline-block; background: #1C6B47; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600;">Record your interview</a>
    </p>
    <p style="color: #6b7c72; font-size: 14px;">From ${payload.senderName}</p>
  `);

  return sendEmail({ to: payload.to, subject, html, text });
}

export async function sendInterviewSubmittedEmail(input: {
  to: string;
  candidateName: string | null;
  jobTitle: string;
  workspaceName: string;
}) {
  const firstName = input.candidateName
    ? firstNameFromFullName(input.candidateName)
    : null;
  const greeting = firstName ? `Hi ${firstName},` : "Hi,";
  const subject = `We received your interview — ${input.jobTitle}`;
  const text = `${greeting}

Thanks for completing your video interview for ${input.jobTitle} at ${input.workspaceName}.

We've received your responses. The hiring team will review them and reach out if there's a next step.

You don't need to do anything else for now.

— ${PRODUCT_NAME}`;

  const html = emailLayout(`
    <p>${greeting}</p>
    <p>Thanks for completing your video interview for <strong>${input.jobTitle}</strong> at <strong>${input.workspaceName}</strong>.</p>
    <p>We've received your responses. The hiring team will review them and reach out if there's a next step.</p>
    <p style="color: #4a5c52;">You don't need to do anything else for now.</p>
  `);

  return sendEmail({ to: input.to, subject, html, text });
}

export function mergeInviteMessage(template: string, firstName: string) {
  return template.replace(/\[First name\]/g, firstName);
}

export function firstNameFromFullName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}
