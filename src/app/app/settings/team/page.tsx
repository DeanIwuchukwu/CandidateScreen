import { requireSessionUser } from "@/lib/auth/session";
import { getUserWorkspace } from "@/lib/recruiter/queries";
import { getTeamRoster } from "@/lib/team/queries";
import { isAdmin } from "@/lib/team/permissions";
import { TeamSection } from "@/components/recruiter/team-section";
import { SettingsTabs } from "@/components/recruiter/recruiter-ui";

export default async function SettingsTeamPage() {
  const user = await requireSessionUser();
  const membership = await getUserWorkspace(user.id);
  const { workspace, role } = membership;
  const roster = await getTeamRoster(workspace.id, user.id);

  return (
    <>
      <div className="px-8 pt-[22px]">
        <h1 className="font-display text-[28px] font-medium leading-none">Settings</h1>
        <SettingsTabs active="team" />
      </div>

      <div className="px-8 py-[26px]">
        <div className="mx-auto max-w-3xl">
          <TeamSection
            members={roster.members}
            pendingInvites={roster.pendingInvites}
            isAdmin={isAdmin(role)}
          />
        </div>
      </div>
    </>
  );
}
