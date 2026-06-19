import { requireSessionUser } from "@/lib/auth/session";
import { RecruiterSidebar } from "@/components/recruiter/recruiter-sidebar";
import { DevBypassBanner } from "@/components/dev/dev-bypass-banner";
import { isDevBypass } from "@/lib/dev/bypass";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSessionUser();
  const membership = user.memberships[0];
  const workspaceName = membership?.workspace.name ?? "Workspace";
  const bypass = isDevBypass();

  return (
    <div className="flex min-h-screen bg-surface">
      <RecruiterSidebar userName={user.name} workspaceName={workspaceName} />
      <div className="flex min-w-0 flex-1 flex-col">
        {bypass && <DevBypassBanner />}
        {children}
      </div>
    </div>
  );
}
