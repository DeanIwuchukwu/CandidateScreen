import Link from "next/link";
import { Wordmark } from "@/components/ui/wordmark";

const linkMap: Record<string, string> = {
  Features: "/#product",
  Pricing: "/#pricing",
  Security: "/#product",
  Changelog: "/#product",
  About: "/contact",
  Customers: "/#customers",
  Careers: "/contact",
  Contact: "/contact",
  Privacy: "#",
  Terms: "#",
  GDPR: "#",
  DPA: "#",
};

export function MarketingFooter() {
  return (
    <footer className="bg-ink text-[#C5CAC2]">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-4 md:px-14">
        <div>
          <Wordmark light href="/" />
          <p className="mt-3.5 max-w-[260px] text-[13.5px] leading-relaxed text-[#9AA09A]">
            Async video interviews that put candidates at ease and give your team hours back.
          </p>
        </div>
        {[
          {
            title: "Product",
            links: ["Features", "Pricing", "Security", "Changelog"],
          },
          {
            title: "Company",
            links: ["About", "Customers", "Careers", "Contact"],
          },
          {
            title: "Legal",
            links: ["Privacy", "Terms", "GDPR", "DPA"],
          },
        ].map((col) => (
          <div key={col.title} className="flex flex-col gap-2.5 text-[13.5px] font-medium">
            <span className="mb-1 text-xs font-semibold uppercase tracking-wider text-white">
              {col.title}
            </span>
            {col.links.map((link) => (
              <Link
                key={link}
                href={linkMap[link] ?? "#"}
                className="text-[#9AA09A] hover:text-white"
              >
                {link}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </footer>
  );
}
