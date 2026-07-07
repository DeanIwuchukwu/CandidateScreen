"use client";

import Link from "next/link";
import { useState } from "react";
import { Link2, Mail, Share2 } from "lucide-react";
import { jobPublicPath } from "@/lib/jobs/urls";

export function PublishJobModal({
  open,
  onClose,
  publicUrl,
  displayUrl,
  listOnCareersPage,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  publicUrl: string;
  displayUrl: string;
  listOnCareersPage: boolean;
  onDone: () => void;
}) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  const slug = publicUrl.split("/p/")[1] ?? "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(24,33,27,0.34)]"
        aria-label="Close modal"
        onClick={onClose}
      />
      <div className="relative w-full max-w-[520px] overflow-hidden rounded-[20px] bg-surface shadow-[0_40px_80px_-30px_rgba(20,40,30,0.55)]">
        <div className="px-9 pb-7 pt-[34px] text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary-tint font-display text-[28px] text-primary">
            ✓
          </div>
          <h2 className="mt-[18px] font-display text-[28px] font-medium leading-tight">
            Your job is live
          </h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
            Share this link anywhere — anyone who opens it can view the role and submit an
            application in minutes.
          </p>
          <div className="mt-6 flex items-center gap-2.5 rounded-[12px] border border-[#E4DDCD] bg-paper-2 py-1.5 pl-4 pr-1.5">
            <Link2 size={16} className="shrink-0 text-primary" strokeWidth={1.8} />
            <span className="min-w-0 flex-1 truncate text-left text-sm font-semibold">
              {displayUrl}
            </span>
            <button
              type="button"
              onClick={copyLink}
              className="shrink-0 rounded-[9px] bg-primary px-[18px] py-2.5 text-[13px] font-semibold text-white"
            >
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
          <div className="mt-[18px] flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-[10px] border border-[#E0D9C8] bg-white px-4 py-2.5 text-[13px] font-semibold"
            >
              LinkedIn
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-[10px] border border-[#E0D9C8] bg-white px-4 py-2.5 text-[13px] font-semibold"
            >
              <Mail size={15} /> Email
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-[10px] border border-[#E0D9C8] bg-white px-4 py-2.5 text-[13px] font-semibold"
            >
              <Share2 size={15} /> More
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline-3 bg-[#FCFAF5] px-9 py-4">
          <span className="text-[12.5px] font-medium text-faint">
            {listOnCareersPage ? "Visible on careers.northwind.com" : "Link-only listing"}
          </span>
          <div className="flex gap-2.5">
            <Link
              href={jobPublicPath(slug)}
              target="_blank"
              className="rounded-[9px] border border-[#E0D9C8] px-[15px] py-2 text-[13px] font-semibold hover:bg-white"
            >
              View public page
            </Link>
            <button
              type="button"
              onClick={() => {
                onDone();
                onClose();
              }}
              className="rounded-[9px] bg-ink px-4 py-2 text-[13px] font-semibold text-white"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
