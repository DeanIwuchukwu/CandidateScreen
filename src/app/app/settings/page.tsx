import { requireSessionUser } from "@/lib/auth/session";
import { getUserWorkspace } from "@/lib/recruiter/queries";
import { updateWorkspaceAction } from "@/lib/recruiter/actions";
import { getTeamRoster } from "@/lib/team/queries";
import { isAdmin } from "@/lib/team/permissions";
import { Button } from "@/components/ui/button";
import { TeamSection } from "@/components/recruiter/team-section";
import {
  SettingsTabs,
  ToggleSwitch,
} from "@/components/recruiter/recruiter-ui";

const accentColors = ["#1C6B47", "#2A6FDB", "#B5503D", "#6B4E8A", "#19211B"];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireSessionUser();
  const membership = await getUserWorkspace(user.id);
  const { workspace, role } = membership;
  const roster = await getTeamRoster(workspace.id, user.id);
  const { error } = await searchParams;

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

      <div className="grid items-start gap-6 px-8 py-[26px] lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col gap-[22px]">
          <form
            action={updateWorkspaceAction}
            id="branding"
            className="scroll-mt-24 rounded-2xl border border-hairline p-6"
          >
            <h2 className="mb-[18px] text-[15px] font-semibold">Company profile</h2>
            <div className="mb-5 flex items-center gap-4">
              <div className="grid h-[60px] w-[60px] place-items-center rounded-[14px] bg-ink text-2xl font-bold text-white">
                {workspace.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <Button type="button" variant="secondary" size="sm">
                  Upload logo
                </Button>
                <p className="mt-1.5 text-[11.5px] font-medium text-faint-2">
                  PNG or SVG, at least 256px
                </p>
              </div>
            </div>
            <label className="mb-4 block text-[12.5px] font-semibold text-muted">
              Company name
              <input
                name="name"
                defaultValue={workspace.name}
                disabled={!isAdmin(role)}
                className="mt-1.5 w-full rounded-[10px] border border-[#E4DDCD] px-3 py-2.5 text-sm font-medium disabled:bg-paper-2"
              />
            </label>
            <label className="block text-[12.5px] font-semibold text-muted">
              Careers page URL
              <input
                name="careersUrl"
                defaultValue={workspace.careersUrl ?? ""}
                placeholder="https://company.com/careers"
                disabled={!isAdmin(role)}
                className="mt-1.5 w-full rounded-[10px] border border-[#E4DDCD] px-3 py-2.5 text-sm font-medium disabled:bg-paper-2"
              />
            </label>
            <input type="hidden" name="accentColor" value={workspace.accentColor} />
          </form>

          <div className="rounded-2xl border border-hairline p-6">
            <h2 className="text-[15px] font-semibold">Brand accent</h2>
            <p className="mt-1.5 text-[13px] text-muted">
              Shown to candidates on the interview pages.
            </p>
            <div className="mt-4 flex gap-3">
              {accentColors.map((color) => (
                <span
                  key={color}
                  className="h-[42px] w-[42px] cursor-pointer rounded-[10px]"
                  style={{
                    backgroundColor: color,
                    boxShadow:
                      color === workspace.accentColor
                        ? `0 0 0 2px #fff, 0 0 0 4px ${color}`
                        : undefined,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[22px]">
          <div className="rounded-2xl border border-hairline p-6 scroll-mt-24" id="notifications">
            <h2 className="mb-4 text-[15px] font-semibold">Notifications</h2>
            <div className="flex flex-col gap-4">
              {[
                ["New response received", "Email me when a candidate submits", true],
                ["Daily digest", "One summary each morning", true],
                ["Weekly analytics", "Funnel & score trends", false],
              ].map(([title, desc, on]) => (
                <div key={title as string} className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[13.5px] font-semibold">{title}</div>
                    <div className="text-xs text-faint">{desc}</div>
                  </div>
                  <ToggleSwitch on={on as boolean} />
                </div>
              ))}
            </div>
          </div>

          <TeamSection
            members={roster.members}
            pendingInvites={roster.pendingInvites}
            isAdmin={isAdmin(role)}
          />
        </div>
      </div>

      {isAdmin(role) && (
        <div className="flex items-center justify-end gap-3 border-t border-hairline-3 bg-[#FCFAF5] px-8 py-[18px]">
          <Button variant="secondary" type="button">
            Cancel
          </Button>
          <Button form="branding" type="submit">
            Save changes
          </Button>
        </div>
      )}
    </>
  );
}
