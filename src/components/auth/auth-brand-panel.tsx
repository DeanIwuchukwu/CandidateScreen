import { Wordmark } from "@/components/ui/wordmark";

export function AuthBrandPanel({
  headline,
  subcopy,
  children,
}: {
  headline: string;
  subcopy: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative hidden flex-col overflow-hidden bg-primary p-10 text-[#EFF3EC] lg:flex">
      <div className="absolute -right-24 -top-28 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,.08),transparent_70%)]" />
      <Wordmark light href="/" />
      <div className="relative my-auto">
        <h2 className="max-w-[340px] font-display text-[42px] font-medium leading-tight">
          {headline}
        </h2>
        <p className="mt-4 max-w-[330px] text-base leading-relaxed text-[#EFF3EC]/80">
          {subcopy}
        </p>
        {children}
      </div>
    </div>
  );
}
