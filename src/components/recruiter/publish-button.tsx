"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { publishInterviewAction } from "@/lib/recruiter/actions";
import { Button } from "@/components/ui/button";

export function PublishButton({ interviewId }: { interviewId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await publishInterviewAction(interviewId);
          if (result?.ok) {
            router.push("/app/interviews");
            router.refresh();
          }
        })
      }
    >
      {pending ? "Publishing…" : "Publish & invite"}
    </Button>
  );
}
