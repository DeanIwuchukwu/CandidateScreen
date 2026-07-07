"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { inviteTeamMemberAction } from "@/lib/team/actions";

export function InviteTeamMemberModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"RECRUITER" | "ADMIN">("RECRUITER");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set("email", email);
    fd.set("role", role);
    startTransition(async () => {
      const result = await inviteTeamMemberAction(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEmail("");
      setRole("RECRUITER");
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(24,33,27,0.34)]"
        aria-label="Close modal"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-[18px] border border-hairline bg-surface p-6 shadow-[0_40px_80px_-30px_rgba(20,40,30,0.55)]">
        <h2 className="font-display text-[22px] font-medium">Invite teammate</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          They&apos;ll get an email with a link to join your workspace.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block text-[12.5px] font-semibold text-muted">
            Work email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="mt-1.5 w-full rounded-[10px] border border-[#E4DDCD] px-3 py-2.5 text-sm font-medium"
            />
          </label>
          <label className="block text-[12.5px] font-semibold text-muted">
            Role
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "RECRUITER" | "ADMIN")}
              className="mt-1.5 w-full rounded-[10px] border border-[#E4DDCD] bg-white px-3 py-2.5 text-sm font-medium"
            >
              <option value="RECRUITER">Recruiter</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>

          {error && (
            <p className="text-sm font-medium text-pass" role="alert">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2.5 pt-1">
            <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Sending…" : "Send invite"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
