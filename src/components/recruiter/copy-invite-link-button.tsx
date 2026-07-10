"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { invitePublicUrl } from "@/lib/recruiter/invite-url";

export function CopyInviteLinkButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = invitePublicUrl(token, window.location.origin);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void copy();
      }}
      aria-label={copied ? "Invite link copied" : "Copy invite link"}
      title={copied ? "Copied" : "Copy invite link"}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[#E4DDCD] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-primary hover:bg-paper-2"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}
