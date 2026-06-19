"use client";

import { useState, useTransition } from "react";
import { publishInterviewAction } from "@/lib/recruiter/actions";
import { Button } from "@/components/ui/button";

export function PublishButton({ interviewId }: { interviewId: string }) {
  const [token, setToken] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await publishInterviewAction(interviewId);
            if (result?.token) setToken(result.token);
          })
        }
      >
        {pending ? "Publishing…" : "Publish & invite"}
      </Button>
      {token && (
        <p className="max-w-xs truncate text-xs text-primary">
          Invite link: /i/{token}
        </p>
      )}
    </div>
  );
}
