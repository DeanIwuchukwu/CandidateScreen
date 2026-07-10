export function invitePath(token: string) {
  return `/i/${token}`;
}

export function invitePublicUrl(token: string, baseUrl: string) {
  return `${baseUrl.replace(/\/$/, "")}${invitePath(token)}`;
}
