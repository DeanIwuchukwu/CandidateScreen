import Link from "next/link";
import { Wordmark } from "@/components/ui/wordmark";

const navLinks = [
  { href: "/#product", label: "Product" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#customers", label: "Customers" },
];

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-hairline-3 bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-14">
        <Wordmark />
        <nav className="hidden items-center gap-8 text-sm font-semibold text-ink-2 md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-ink">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-semibold text-ink-2 hover:text-ink">
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex h-9 items-center justify-center rounded-[10px] bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-[#185a3c]"
          >
            Start free
          </Link>
        </div>
      </div>
    </header>
  );
}
