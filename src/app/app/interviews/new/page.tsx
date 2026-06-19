import { createInterviewAction } from "@/lib/recruiter/actions";

export default function NewInterviewPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <form action={createInterviewAction} className="w-full max-w-md space-y-4">
        <h1 className="font-display text-2xl font-medium">Create an interview</h1>
        <label className="block text-sm">
          <span className="font-semibold text-muted">Role title</span>
          <input
            name="title"
            required
            placeholder="Product Designer"
            className="mt-1 w-full rounded-[10px] border border-[#E4DDCD] px-3 py-2.5"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-[10px] bg-primary py-3 text-sm font-semibold text-white"
        >
          Continue to builder
        </button>
      </form>
    </div>
  );
}
