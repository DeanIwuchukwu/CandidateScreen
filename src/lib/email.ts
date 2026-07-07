import { Resend } from "resend";

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
  return process.env.EMAIL_FROM ?? "Candidate Screen <onboarding@resend.dev>";
}

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function emailLayout(content: string) {
  return `<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1a2b22; max-width: 560px; margin: 0 auto; padding: 24px;">
  <div style="margin-bottom: 24px; font-size: 18px; font-weight: 600; color: #1C6B47;">Candidate Screen</div>
  ${content}
  <p style="margin-top: 32px; font-size: 12px; color: #6b7c72;">Candidate Screen · Async video interviews</p>
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
  const subject = "Welcome to Candidate Screen";
  const text = `Hi ${input.name},

Welcome to Candidate Screen! Your workspace for ${input.companyName} is ready.

Open your dashboard: ${dashboardUrl}

— The Candidate Screen team`;

  const html = emailLayout(`
    <p>Hi ${input.name},</p>
    <p>Welcome to <strong>Candidate Screen</strong>! Your workspace for <strong>${input.companyName}</strong> is ready.</p>
    <p style="margin: 28px 0;">
      <a href="${dashboardUrl}" style="display: inline-block; background: #1C6B47; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600;">Open your dashboard</a>
    </p>
    <p style="color: #4a5c52;">Create interviews, publish job listings, and review candidate responses — all in one place.</p>
  `);

  return sendEmail({ to: input.to, subject, html, text });
}

export async function sendPasswordResetEmail(input: { to: string; resetUrl: string }) {
  const subject = "Reset your Candidate Screen password";
  const text = `Reset your password using this link (expires in 1 hour):

${input.resetUrl}

If you didn't request this, you can ignore this email.`;

  const html = emailLayout(`
    <p>You requested a password reset for your Candidate Screen account.</p>
    <p style="margin: 28px 0;">
      <a href="${input.resetUrl}" style="display: inline-block; background: #1C6B47; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600;">Reset password</a>
    </p>
    <p style="color: #6b7c72; font-size: 14px;">This link expires in 1 hour. If you didn't request a reset, you can safely ignore this email.</p>
  `);

  return sendEmail({ to: input.to, subject, html, text });
}

export async function sendInterviewInviteEmail(payload: InviteEmailPayload) {
  const subject = `Video interview invitation — ${payload.jobTitle}`;
  const text = `${payload.message}\n\nRecord your interview: ${payload.inviteUrl}\n\n— ${payload.senderName}`;

  const html = emailLayout(`
    <p style="white-space: pre-wrap;">${payload.message.replace(/\n/g, "<br>")}</p>
    <p style="margin: 28px 0;">
      <a href="${payload.inviteUrl}" style="display: inline-block; background: #1C6B47; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600;">Record your interview</a>
    </p>
    <p style="color: #6b7c72; font-size: 14px;">From ${payload.senderName}</p>
  `);

  return sendEmail({ to: payload.to, subject, html, text });
}

export function mergeInviteMessage(template: string, firstName: string) {
  return template.replace(/\[First name\]/g, firstName);
}

export function firstNameFromFullName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}
