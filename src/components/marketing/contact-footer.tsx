import Link from "next/link";
import { Wordmark } from "@/components/ui/wordmark";

export function ContactFooter() {
  return (
    <footer className="bg-ink px-6 py-10 text-[#9AA09A] md:px-14">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
        <Wordmark light href="/" />
        <p className="text-[13px] font-medium">
          © 2026 Candidate Screen ·{" "}
          <Link href="#" className="hover:text-white">Privacy</Link>
          {" · "}
          <Link href="#" className="hover:text-white">Terms</Link>
        </p>
      </div>
    </footer>
  );
}
