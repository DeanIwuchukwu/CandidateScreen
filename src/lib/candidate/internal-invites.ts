export const PREVIEW_INVITE_EMAIL_PREFIX = "preview@internal.";
export const SHARE_INVITE_EMAIL_PREFIX = "share@internal.";

export function previewInviteEmail(interviewId: string) {
  return `${PREVIEW_INVITE_EMAIL_PREFIX}${interviewId}`;
}

export function shareInviteEmail(interviewId: string) {
  return `${SHARE_INVITE_EMAIL_PREFIX}${interviewId}`;
}

export function isPreviewInviteEmail(email: string | null | undefined) {
  return Boolean(email?.startsWith(PREVIEW_INVITE_EMAIL_PREFIX));
}

export function isShareInviteEmail(email: string | null | undefined) {
  return Boolean(email?.startsWith(SHARE_INVITE_EMAIL_PREFIX));
}

export function isInternalInviteEmail(email: string | null | undefined) {
  return isPreviewInviteEmail(email) || isShareInviteEmail(email);
}

export function isRealCandidateInvite(invite: {
  email?: string | null;
  candidateName?: string | null;
}) {
  if (invite.email && isInternalInviteEmail(invite.email)) return false;
  if (invite.candidateName === "Demo Candidate") return false;
  if (invite.candidateName === "Preview") return false;
  return true;
}
