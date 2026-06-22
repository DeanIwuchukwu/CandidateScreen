"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { addQuestionAction } from "@/lib/recruiter/actions";

export function AddQuestionButton({ interviewId }: { interviewId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleAdd = () => {
    startTransition(async () => {
      await addQuestionAction(interviewId);
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleAdd}
      className="flex w-full items-center justify-center gap-2 rounded-[13px] border border-dashed border-[#D2CBB9] py-4 text-[13.5px] font-semibold text-primary hover:border-primary disabled:opacity-60"
    >
      {pending ? "Adding…" : "+ Add a question"}
    </button>
  );
}
