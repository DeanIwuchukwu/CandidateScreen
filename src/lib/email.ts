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
  questionCount: number;
  deadlineDays: number;
  allowRetakes: boolean;
  /** Approx duration label, e.g. 10 */
  estimatedMinutes: number;
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function productWordmarkHtml(variant: "default" | "onGreen" = "default") {
  if (variant === "onGreen") {
    return `<span style="display:inline-block;width:22px;height:22px;background:#ffffff;border-radius:50%;vertical-align:middle;margin-right:8px;"></span>Talang<span style="color:#BFE0CD;"> Flow</span>`;
  }
  return `<span style="display:inline-block;width:22px;height:22px;background:#1C6B47;border-radius:50%;vertical-align:middle;margin-right:8px;"></span>Talang<span style="color:#1C6B47;"> Flow</span>`;
}

/** Rough interview length from per-question limits (fallback: 2 min × questions). */
export function estimateInterviewMinutes(
  questions: Array<{ timeLimitSec: number }>,
) {
  if (questions.length === 0) return 10;
  const totalSec = questions.reduce((sum, q) => sum + (q.timeLimitSec || 120), 0);
  return Math.max(1, Math.round(totalSec / 60));
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
  const helpUrl = `${appUrl()}/contact`;
  const settingsUrl = `${appUrl()}/app/settings`;
  const firstName = firstNameFromFullName(input.name);
  const subject = `Welcome to ${PRODUCT_NAME}`;
  const text = `Hi ${firstName},

Your workspace for ${input.companyName} is set up and waiting. From here you can create interviews, publish job listings, and review candidate responses — all in one place.

Open your dashboard: ${dashboardUrl}

Get started in 3 steps:
1. Post a job listing
2. Build an interview
3. Invite & review

— The ${PRODUCT_NAME} team`;

  const name = escapeHtml(firstName);
  const company = escapeHtml(input.companyName);
  const dash = escapeHtml(dashboardUrl);
  const help = escapeHtml(helpUrl);
  const settings = escapeHtml(settingsUrl);

  const html = designedEmail({
    preheader: `Your ${PRODUCT_NAME} workspace for ${input.companyName} is ready.`,
    rows: `
      <tr><td class="px" bgcolor="#1C6B47" style="padding:30px 34px 28px;background:#1C6B47;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:500;color:#ffffff;">
            ${productWordmarkHtml("onGreen")}
          </td>
        </tr></table>
        <h1 style="font-family:Georgia,'Times New Roman',serif;font-weight:500;font-size:28px;line-height:1.15;margin:22px 0 0;color:#ffffff;">Welcome, ${name} — your workspace is ready.</h1>
      </td></tr>
      <tr><td class="px" style="padding:30px 34px 6px;">
        <p style="font-size:16px;line-height:1.65;color:#5C6056;margin:0;">Your workspace for <strong style="color:#19211B;">${company}</strong> is set up and waiting. From here you can create interviews, publish job listings, and review candidate responses — all in one place.</p>
      </td></tr>
      <tr><td class="px" style="padding:22px 34px 4px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" bgcolor="#1C6B47" style="border-radius:12px;">
          <a href="${dash}" style="display:block;padding:15px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;">Open your dashboard &rarr;</a>
        </td></tr></table>
      </td></tr>
      <tr><td class="px" style="padding:26px 34px 4px;">
        <div style="font-size:11.5px;letter-spacing:1px;text-transform:uppercase;color:#9A9C92;font-weight:bold;margin-bottom:16px;">Get started in 3 steps</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td width="39" valign="top" style="padding-bottom:15px;"><div style="width:26px;height:26px;border-radius:50%;background:#E7F0EA;color:#1C6B47;text-align:center;line-height:26px;font-size:12px;font-weight:bold;">1</div></td>
              <td valign="top" style="padding-bottom:15px;"><div style="font-size:14px;font-weight:bold;color:#19211B;">Post a job listing</div><div style="font-size:13px;line-height:1.5;color:#74776E;">Share one link and start collecting applications.</div></td></tr>
          <tr><td width="39" valign="top" style="padding-bottom:15px;"><div style="width:26px;height:26px;border-radius:50%;background:#E7F0EA;color:#1C6B47;text-align:center;line-height:26px;font-size:12px;font-weight:bold;">2</div></td>
              <td valign="top" style="padding-bottom:15px;"><div style="font-size:14px;font-weight:bold;color:#19211B;">Build an interview</div><div style="font-size:13px;line-height:1.5;color:#74776E;">A few questions, time limits, and your branding.</div></td></tr>
          <tr><td width="39" valign="top"><div style="width:26px;height:26px;border-radius:50%;background:#E7F0EA;color:#1C6B47;text-align:center;line-height:26px;font-size:12px;font-weight:bold;">3</div></td>
              <td valign="top"><div style="font-size:14px;font-weight:bold;color:#19211B;">Invite &amp; review</div><div style="font-size:13px;line-height:1.5;color:#74776E;">Watch answers and decide as a team.</div></td></tr>
        </table>
      </td></tr>
      <tr><td class="px" style="padding:22px 34px 26px;border-top:1px solid #F1ECE0;">
        <div style="font-size:12px;color:#9A9C92;font-weight:bold;">${PRODUCT_NAME} &middot; ${PRODUCT_TAGLINE}</div>
        <p style="font-size:11.5px;line-height:1.6;color:#A7A99F;margin:12px 0 0;">Need a hand getting set up? Just reply to this email. &middot; <a href="${help}" style="color:#7C9B88;">Help center</a> &middot; <a href="${settings}" style="color:#7C9B88;">Settings</a></p>
      </td></tr>
    `,
  });

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
  const firstName = firstNameFromFullName(payload.candidateName);
  const subject = `You're invited: ${payload.jobTitle} video interview`;
  const text = `Hi ${firstName},

${payload.workspaceName} has invited you to a short video interview for ${payload.jobTitle}.

${payload.message}

≈ ${payload.estimatedMinutes} minutes · ${payload.questionCount} questions · Record anytime${
    payload.allowRetakes ? " · Retakes allowed" : ""
  }

Please respond within ${payload.deadlineDays} days.

Record your interview: ${payload.inviteUrl}

— ${payload.senderName} at ${payload.workspaceName} via ${PRODUCT_NAME}`;

  const name = escapeHtml(firstName);
  const company = escapeHtml(payload.workspaceName);
  const role = escapeHtml(payload.jobTitle);
  const inviteUrl = escapeHtml(payload.inviteUrl);
  const sender = escapeHtml(payload.senderName);
  const senderInitials = escapeHtml(initialsFromName(payload.senderName) || "TF");
  const quote = escapeHtml(payload.message.replace(/\s+/g, " ").trim());
  const minutes = escapeHtml(String(payload.estimatedMinutes));
  const questions = escapeHtml(String(payload.questionCount));
  const deadline = escapeHtml(String(payload.deadlineDays));
  const contactUrl = escapeHtml(`${appUrl()}/contact`);
  const retakeChip = payload.allowRetakes
    ? `<span style="display:inline-block;border:1px solid #E6E0D2;border-radius:999px;padding:7px 13px;margin:0 6px 8px 0;">Retakes allowed</span>`
    : "";

  const html = designedEmail({
    preheader: `A short video interview from ${payload.workspaceName} — record whenever suits you.`,
    rows: `
      <tr><td class="px" style="padding:26px 34px;border-bottom:1px solid #F1ECE0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:500;color:#19211B;">${productWordmarkHtml()}</td>
          <td align="right" style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9A9C92;font-weight:bold;">${company}</td>
        </tr></table>
      </td></tr>
      <tr><td class="px" style="padding:32px 34px 8px;">
        <span style="display:inline-block;font-size:12px;color:#1C6B47;background:#E7F0EA;padding:6px 12px;border-radius:999px;font-weight:bold;margin-bottom:16px;">Video interview &middot; ${role}</span>
        <h1 style="font-family:Georgia,'Times New Roman',serif;font-weight:500;font-size:28px;line-height:1.15;margin:12px 0 0;color:#19211B;">Hi ${name} — we&rsquo;d love to hear how you think.</h1>
        <p style="font-size:16px;line-height:1.65;color:#5C6056;margin:14px 0 0;">${company} has invited you to a short video interview. There&rsquo;s no live call to schedule and no trick questions — just a few prompts you can record whenever suits you${payload.allowRetakes ? ", and re-record if you&rsquo;d like" : ""}.</p>
      </td></tr>
      <tr><td class="px" style="padding:20px 34px 4px;font-size:13px;color:#3C4138;">
        <span style="display:inline-block;border:1px solid #E6E0D2;border-radius:999px;padding:7px 13px;margin:0 6px 8px 0;">&asymp; ${minutes} minutes</span>
        <span style="display:inline-block;border:1px solid #E6E0D2;border-radius:999px;padding:7px 13px;margin:0 6px 8px 0;">${questions} question${payload.questionCount === 1 ? "" : "s"}</span>
        <span style="display:inline-block;border:1px solid #E6E0D2;border-radius:999px;padding:7px 13px;margin:0 6px 8px 0;">Record anytime</span>
        ${retakeChip}
      </td></tr>
      <tr><td class="px" style="padding:24px 34px 6px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" bgcolor="#1C6B47" style="border-radius:12px;">
          <a href="${inviteUrl}" style="display:block;padding:15px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;">Record your interview &rarr;</a>
        </td></tr></table>
        <p style="font-size:12px;color:#9A9C92;text-align:center;margin:12px 0 0;">Please respond within <strong style="color:#5C6056;">${deadline} days</strong> &middot; your link is private to you</p>
      </td></tr>
      <tr><td class="px" style="padding:24px 34px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F3EA;border:1px solid #ECE5D6;border-radius:14px;"><tr>
          <td width="52" valign="top" style="padding:16px 0 16px 18px;">
            <div style="width:40px;height:40px;border-radius:50%;background:#1C6B47;color:#fff;text-align:center;line-height:40px;font-size:13px;font-weight:bold;">${senderInitials}</div>
          </td>
          <td valign="top" style="padding:16px 18px;">
            <div style="font-size:13.5px;font-weight:bold;color:#19211B;">${sender} <span style="color:#9A9C92;font-weight:normal;">&middot; ${company}</span></div>
            <p style="font-family:Georgia,serif;font-style:italic;font-size:14.5px;line-height:1.5;color:#4A4F45;margin:5px 0 0;">&ldquo;${quote}&rdquo;</p>
          </td>
        </tr></table>
      </td></tr>
      <tr><td class="px" style="padding:22px 34px 26px;border-top:1px solid #F1ECE0;">
        <div style="font-size:12px;color:#9A9C92;font-weight:bold;">${PRODUCT_NAME} &middot; ${PRODUCT_TAGLINE}</div>
        <p style="font-size:11.5px;line-height:1.6;color:#A7A99F;margin:12px 0 0;">You received this because ${company} invited you to interview. Trouble with the button? Copy this link: <a href="${inviteUrl}" style="color:#7C9B88;">${inviteUrl}</a> &middot; <a href="${contactUrl}" style="color:#7C9B88;">Not you?</a></p>
      </td></tr>
    `,
  });

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
      <tr><td class="px" style="padding:22px 34px 4px;">
        <div style="font-size:11.5px;letter-spacing:1px;text-transform:uppercase;color:#9A9C92;font-weight:bold;margin-bottom:14px;">What happens next</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td width="20" valign="top" style="padding-bottom:12px;"><div style="width:8px;height:8px;border-radius:50%;background:#1C6B47;margin-top:6px;"></div></td><td valign="top" style="padding-bottom:12px;font-size:13.5px;line-height:1.5;color:#5C6056;"><strong style="color:#19211B;">The team reviews your answers</strong> when they&rsquo;re ready.</td></tr>
          <tr><td width="20" valign="top"><div style="width:8px;height:8px;border-radius:50%;background:#CDD6CE;margin-top:6px;"></div></td><td valign="top" style="font-size:13.5px;line-height:1.5;color:#5C6056;">You&rsquo;ll hear back by email if there&rsquo;s a next step.</td></tr>
        </table>
      </td></tr>
      <tr><td class="px" style="padding:22px 34px 26px;border-top:1px solid #F1ECE0;">
        <div style="font-size:12px;color:#9A9C92;font-weight:bold;">${PRODUCT_NAME} &middot; ${PRODUCT_TAGLINE}</div>
        <p style="font-size:11.5px;line-height:1.6;color:#A7A99F;margin:12px 0 0;">Sent on behalf of ${company}. You can request deletion of your recordings anytime &middot; <a href="${contactUrl}" style="color:#7C9B88;">Contact us</a></p>
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
