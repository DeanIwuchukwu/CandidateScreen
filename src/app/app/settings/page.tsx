import { requireSessionUser } from "@/lib/auth/session";
import { getUserWorkspace } from "@/lib/recruiter/queries";
import { updateWorkspaceAction } from "@/lib/recruiter/actions";
import { isAdmin } from "@/lib/team/permissions";
import { resolveMediaUrl } from "@/lib/storage";
import { SettingsTabs } from "@/components/recruiter/recruiter-ui";
import { WorkspaceSettingsForm } from "@/components/recruiter/workspace-settings-form";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const user = await requireSessionUser();
  const membership = await getUserWorkspace(user.id);
  const { workspace, role } = membership;
  const { error, saved } = await searchParams;
  const logoUrl = await resolveMediaUrl(workspace.logoUrl);

  return (
    <>
      <div className="px-8 pt-[22px]">
        <h1 className="font-display text-[28px] font-medium leading-none">Settings</h1>
        <SettingsTabs active="workspace" />
      </div>

      {error === "forbidden" && (
        <p className="mx-8 mt-4 rounded-[10px] bg-[#FDF5F0] px-3 py-2.5 text-sm font-medium text-pass">
          Only admins can update workspace settings.
        </p>
      )}
      {error === "logo" && (
        <p className="mx-8 mt-4 rounded-[10px] bg-[#FDF5F0] px-3 py-2.5 text-sm font-medium text-pass">
          Logo must be a PNG, JPG, WebP, or SVG under 2MB.
        </p>
      )}
      {saved && (
        <p className="mx-8 mt-4 rounded-[10px] bg-primary-tint px-3 py-2.5 text-sm font-medium text-primary">
          Workspace settings saved.
        </p>
      )}

      <WorkspaceSettingsForm
        canEdit={isAdmin(role)}
        action={updateWorkspaceAction}
        workspace={{
          name: workspace.name,
          careersUrl: workspace.careersUrl,
          accentColor: workspace.accentColor,
          logoUrl,
        }}
      />
    </>
  );
}
