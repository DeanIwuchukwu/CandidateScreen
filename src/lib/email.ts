import { Resend } from "resend";
import { EMAIL_FROM_FALLBACK, PRODUCT_NAME, PRODUCT_TAGLINE } from "@/lib/brand";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Overrides the display name in From (address stays from EMAIL_FROM). */
  fromName?: string;
};

type InviteEmailPayload = {
  to: string;
  candidateName: string;
  jobTitle: string;
  message: string;
  inviteUrl: string;
  senderName: string;
  /** Company shown as the From display name in the inbox */
  workspaceName: string;
};

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resendClient) resendClient = new Resend(apiKey);
  return resendClient;
}

function emailFromConfigured() {
  return process.env.EMAIL_FROM ?? EMAIL_FROM_FALLBACK;
}

/** Pull bare address from `Name <addr@domain>` or a bare address. */
function emailFromAddress() {
  const configured = emailFromConfigured();
  const match = configured.match(/<([^>]+)>/);
  return (match?.[1] ?? configured).trim();
}

function formatFrom(displayName?: string) {
  const address = emailFromAddress();
  const name = displayName?.replace(/[<>"]/g, "").trim();
  if (!name) return emailFromConfigured();
  return `${name} <${address}>`;
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function productWordmarkHtml() {
  return `<span style="display:inline-block;width:22px;height:22px;background:#1C6B47;border-radius:50%;vertical-align:middle;margin-right:8px;"></span>Talang<span style="color:#1C6B47;"> Flow</span>`;
}

function designedEmail(opts: {
  preheader: string;
  rows: string;
}) {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<!--[if mso]><style>*{font-family:Arial,Helvetica,sans-serif!important}</style><![endif]-->
<style>@media only screen and (max-width:600px){.container{width:100%!important}.px{padding-left:22px!important;padding-right:22px!important}}</style>
</head>
<body style="margin:0;padding:0;background:#F6F2EA;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(opts.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6F2EA;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="512" class="container" cellpadding="0" cellspacing="0" style="width:512px;max-width:512px;background:#ffffff;border:1px solid #EEE7D9;border-radius:16px;overflow:hidden;font-family:'Hanken Grotesk',Helvetica,Arial,sans-serif;">
      ${opts.rows}
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function initialsFromName(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

async function sendEmail(input: SendEmailInput) {
  const client = getResendClient();
  if (!client) {
    console.info("[email]", { to: input.to, subject: input.subject, text: input.text });
    return { ok: true as const };
  }

  const { error } = await client.emails.send({
    from: formatFrom(input.fromName),
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
  const text = `Reset your password using this link (expires in 60 minutes):

${input.resetUrl}

If you didn't request this, you can ignore this email — your password won't change.`;

  const email = escapeHtml(input.to);
  const resetUrl = escapeHtml(input.resetUrl);
  const html = designedEmail({
    preheader: `Reset your ${PRODUCT_NAME} password — this link expires in 60 minutes.`,
    rows: `
      <tr><td class="px" style="padding:26px 34px;border-bottom:1px solid #F1ECE0;font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:500;color:#19211B;">
        ${productWordmarkHtml()}
      </td></tr>
      <tr><td class="px" style="padding:32px 34px 6px;">
        <div style="width:52px;height:52px;border-radius:14px;background:#E7F0EA;text-align:center;line-height:52px;font-size:24px;margin-bottom:18px;">&#128274;</div>
        <h1 style="font-family:Georgia,'Times New Roman',serif;font-weight:500;font-size:28px;line-height:1.15;margin:0;color:#19211B;">Let&rsquo;s get you back in.</h1>
        <p style="font-size:16px;line-height:1.65;color:#5C6056;margin:14px 0 0;">We got a request to reset the password for <strong style="color:#19211B;">${email}</strong>. Click below to choose a new one — the link is good for <strong style="color:#3C4138;">60 minutes</strong>.</p>
      </td></tr>
      <tr><td class="px" style="padding:24px 34px 6px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" bgcolor="#1C6B47" style="border-radius:12px;">
          <a href="${resetUrl}" style="display:block;padding:15px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;">Reset my password</a>
        </td></tr></table>
      </td></tr>
      <tr><td class="px" style="padding:24px 34px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F3EA;border:1px solid #ECE5D6;border-radius:14px;"><tr><td style="padding:15px 18px;font-size:13px;line-height:1.55;color:#5C6056;">Didn&rsquo;t ask for this? You can safely ignore this email — your password won&rsquo;t change until you use the link above.</td></tr></table>
      </td></tr>
      <tr><td class="px" style="padding:22px 34px 26px;border-top:1px solid #F1ECE0;">
        <div style="font-size:12px;color:#9A9C92;font-weight:bold;">${PRODUCT_NAME} &middot; ${PRODUCT_TAGLINE}</div>
        <p style="font-size:11.5px;line-height:1.6;color:#A7A99F;margin:12px 0 0;">Trouble with the button? Copy this link: <a href="${resetUrl}" style="color:#7C9B88;">${resetUrl}</a></p>
      </td></tr>
    `,
  });

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
  const roleDesc =
    input.role === "ADMIN"
      ? "Full access to workspace settings, team, and interviews"
      : "Review candidates, rate, and manage interviews";
  const subject = `${input.inviterName} invited you to ${input.workspaceName} on ${PRODUCT_NAME}`;
  const text = `${input.inviterName} invited you to join ${input.workspaceName} as ${roleLabel}.

Accept the invite: ${input.joinUrl}

This link expires in 7 days.`;

  const inviter = escapeHtml(input.inviterName);
  const company = escapeHtml(input.workspaceName);
  const acceptUrl = escapeHtml(input.joinUrl);
  const initials = escapeHtml(initialsFromName(input.inviterName) || "TF");
  const contactUrl = escapeHtml(`${appUrl()}/contact`);

  const html = designedEmail({
    preheader: `${input.inviterName} invited you to join ${input.workspaceName} on ${PRODUCT_NAME}.`,
    rows: `
      <tr><td class="px" style="padding:26px 34px;border-bottom:1px solid #F1ECE0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:500;color:#19211B;">${productWordmarkHtml()}</td>
          <td align="right" style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9A9C92;font-weight:bold;">${company}</td>
        </tr></table>
      </td></tr>
      <tr><td class="px" style="padding:32px 34px 6px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px;"><tr>
          <td width="55" valign="middle"><div style="width:44px;height:44px;border-radius:50%;background:#1C6B47;color:#fff;text-align:center;line-height:44px;font-size:14px;font-weight:bold;">${initials}</div></td>
          <td valign="middle" style="font-size:14px;line-height:1.4;color:#5C6056;"><strong style="color:#19211B;">${inviter}</strong> invited you to join the <strong style="color:#19211B;">${company}</strong> hiring team.</td>
        </tr></table>
        <h1 style="font-family:Georgia,'Times New Roman',serif;font-weight:500;font-size:28px;line-height:1.15;margin:0;color:#19211B;">Come help hire the team.</h1>
        <p style="font-size:16px;line-height:1.65;color:#5C6056;margin:14px 0 0;">You&rsquo;ve been added as a <strong style="color:#19211B;">${roleLabel}</strong>. Accept your invite to review candidate interviews, leave scores, and decide together.</p>
      </td></tr>
      <tr><td class="px" style="padding:22px 34px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #ECE5D6;border-radius:12px;"><tr>
          <td width="52" valign="middle" style="padding:14px 0 14px 16px;"><div style="width:34px;height:34px;border-radius:9px;background:#E7F0EA;text-align:center;line-height:34px;color:#1C6B47;font-size:16px;">&#128100;</div></td>
          <td valign="middle" style="padding:14px 16px;"><div style="font-size:13.5px;font-weight:bold;color:#19211B;">${roleLabel} access</div><div style="font-size:12px;color:#80837A;">${escapeHtml(roleDesc)}</div></td>
        </tr></table>
      </td></tr>
      <tr><td class="px" style="padding:22px 34px 6px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" bgcolor="#1C6B47" style="border-radius:12px;">
          <a href="${acceptUrl}" style="display:block;padding:15px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;">Accept invitation</a>
        </td></tr></table>
        <p style="font-size:12px;color:#9A9C92;text-align:center;margin:12px 0 0;">This invite expires in <strong style="color:#5C6056;">7 days</strong></p>
      </td></tr>
      <tr><td class="px" style="padding:22px 34px 26px;border-top:1px solid #F1ECE0;">
        <div style="font-size:12px;color:#9A9C92;font-weight:bold;">${PRODUCT_NAME} &middot; ${PRODUCT_TAGLINE}</div>
        <p style="font-size:11.5px;line-height:1.6;color:#A7A99F;margin:12px 0 0;">You received this because ${inviter} invited you to ${company}. Didn&rsquo;t expect this? You can ignore it — nothing happens until you accept. &middot; <a href="${contactUrl}" style="color:#7C9B88;">Contact us</a></p>
      </td></tr>
    `,
  });

  return sendEmail({
    to: input.to,
    subject,
    html,
    text,
    fromName: input.workspaceName,
  });
}

export async function sendInterviewInviteEmail(payload: InviteEmailPayload) {
  const subject = `Video interview invitation — ${payload.jobTitle}`;
  const text = `${payload.message}\n\nRecord your interview: ${payload.inviteUrl}\n\n— ${payload.senderName} via ${PRODUCT_NAME}`;

  const html = emailLayout(`
    <p style="white-space: pre-wrap;">${payload.message.replace(/\n/g, "<br>")}</p>
    <p style="margin: 28px 0;">
      <a href="${payload.inviteUrl}" style="display: inline-block; background: #1C6B47; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600;">Record your interview</a>
    </p>
    <p style="color: #6b7c72; font-size: 14px;">From ${payload.senderName} at ${payload.workspaceName}</p>
  `);

  return sendEmail({
    to: payload.to,
    subject,
    html,
    text,
    fromName: payload.workspaceName,
  });
}

export async function sendInterviewSubmittedEmail(input: {
  to: string;
  candidateName: string | null;
  jobTitle: string;
  workspaceName: string;
  answeredLabel: string;
  submittedDate: string;
}) {
  const firstName = input.candidateName
    ? firstNameFromFullName(input.candidateName)
    : null;
  const subject = `Got it — your interview is in`;
  const text = `${firstName ? `Hi ${firstName},` : "Hi,"}

Your video interview for the ${input.jobTitle} role is on its way to the ${input.workspaceName} team. Thank you for taking the time.

${input.answeredLabel} answered · Submitted ${input.submittedDate}

You've got a confirmation of receipt. The hiring team will reach out if there's a next step.

— ${PRODUCT_NAME}`;

  const name = escapeHtml(firstName ?? "there");
  const role = escapeHtml(input.jobTitle);
  const company = escapeHtml(input.workspaceName);
  const answered = escapeHtml(input.answeredLabel);
  const submitted = escapeHtml(input.submittedDate);
  const contactUrl = escapeHtml(`${appUrl()}/contact`);

  const html = designedEmail({
    preheader: `Your video interview for ${input.workspaceName} is submitted.`,
    rows: `
      <tr><td class="px" style="padding:26px 34px;border-bottom:1px solid #F1ECE0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:500;color:#19211B;">${productWordmarkHtml()}</td>
          <td align="right" style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9A9C92;font-weight:bold;">${company}</td>
        </tr></table>
      </td></tr>
      <tr><td class="px" style="padding:34px 34px 6px;text-align:center;">
        <div style="width:60px;height:60px;border-radius:50%;background:#E7F0EA;text-align:center;line-height:60px;font-family:Georgia,serif;font-size:28px;color:#1C6B47;margin:0 auto 18px;">&#10003;</div>
        <h1 style="font-family:Georgia,'Times New Roman',serif;font-weight:500;font-size:28px;line-height:1.15;margin:0;color:#19211B;">That&rsquo;s a wrap, ${name}.</h1>
        <p style="font-size:16px;line-height:1.65;color:#5C6056;margin:14px 0 0;">Your video interview for the <strong style="color:#19211B;">${role}</strong> role is on its way to the ${company} team. Thank you for taking the time — we know it isn&rsquo;t always easy on camera.</p>
      </td></tr>
      <tr><td class="px" style="padding:24px 34px 4px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F0;border:1px solid #ECE5D6;border-radius:14px;"><tr>
          <td width="50%" style="padding:16px;text-align:center;border-right:1px solid #ECE5D6;"><div style="font-family:Georgia,serif;font-size:22px;color:#19211B;">${answered}</div><div style="font-size:11.5px;color:#80837A;">Answered</div></td>
          <td width="50%" style="padding:16px;text-align:center;"><div style="font-family:Georgia,serif;font-size:22px;color:#19211B;">${submitted}</div><div style="font-size:11.5px;color:#80837A;">Submitted</div></td>
        </tr></table>
      </td></tr>
      <tr><td class="px" style="padding:22px 34px 26px;border-top:1px solid #F1ECE0;">
        <div style="font-size:12px;color:#9A9C92;font-weight:bold;">${PRODUCT_NAME} &middot; ${PRODUCT_TAGLINE}</div>
        <p style="font-size:11.5px;line-height:1.6;color:#A7A99F;margin:12px 0 0;">Sent on behalf of ${company}. Questions? <a href="${contactUrl}" style="color:#7C9B88;">Contact us</a></p>
      </td></tr>
    `,
  });

  return sendEmail({
    to: input.to,
    subject,
    html,
    text,
    fromName: input.workspaceName,
  });
}

export function mergeInviteMessage(template: string, firstName: string) {
  return template.replace(/\[First name\]/g, firstName);
}

export function firstNameFromFullName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}
