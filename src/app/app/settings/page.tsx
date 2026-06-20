import { requireSessionUser } from "@/lib/auth/session";
import { getUserWorkspace, getWorkspaceMembers } from "@/lib/recruiter/queries";
import { updateWorkspaceAction } from "@/lib/recruiter/actions";
import { Button } from "@/components/ui/button";
import {
  AvatarCircle,
  SettingsTabs,
  ToggleSwitch,
} from "@/components/recruiter/recruiter-ui";

const accentColors = ["#1C6B47", "#2A6FDB", "#B5503D", "#6B4E8A", "#19211B"];

export default async function SettingsPage() {
  const user = await requireSessionUser();
  const { workspace } = await getUserWorkspace(user.id);
  const members = await getWorkspaceMembers(workspace.id);

  return (
    <>
      <div className="px-8 pt-[22px]">
        <h1 className="font-display text-[28px] font-medium leading-none">Settings</h1>
        <SettingsTabs active="workspace" />
      </div>

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
                N
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
                className="mt-1.5 w-full rounded-[10px] border border-[#E4DDCD] px-3 py-2.5 text-sm font-medium"
              />
            </label>
            <label className="block text-[12.5px] font-semibold text-muted">
              Careers page URL
              <input
                name="careersUrl"
                defaultValue={workspace.careersUrl ?? "northwind.com/careers"}
                placeholder="https://company.com/careers"
                className="mt-1.5 w-full rounded-[10px] border border-[#E4DDCD] px-3 py-2.5 text-sm font-medium"
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

          <div className="overflow-hidden rounded-2xl border border-hairline scroll-mt-24" id="team">
            <div className="flex items-center justify-between px-[22px] py-4">
              <h2 className="text-[15px] font-semibold">Team · {members.length} members</h2>
              <Button size="sm">
                <span className="mr-1">+</span> Invite
              </Button>
            </div>
            {members.map((m) => {
              const avatar =
                "avatar" in m
                  ? (m as { avatar: { initials: string; color: string } }).avatar
                  : { initials: "??", color: "#1C6B47" };
              const badge =
                "badge" in m ? (m as { badge: string }).badge : m.role.toLowerCase();
              const note = "note" in m ? (m as { note?: string }).note : undefined;

              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 border-t border-hairline-2 px-[22px] py-3"
                >
                  <AvatarCircle initials={avatar.initials} color={avatar.color} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-semibold">
                      {m.user.name}
                      {note === "you" && (
                        <span className="font-medium text-faint-2"> · you</span>
                      )}
                      {note === "pending" && (
                        <span className="font-medium text-warn"> · pending</span>
                      )}
                    </div>
                    <div className="text-[11.5px] font-medium text-faint">{m.user.email}</div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      badge === "Admin"
                        ? "bg-primary-tint text-primary"
                        : "bg-hairline-2 text-muted"
                    }`}
                  >
                    {badge}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-hairline-3 bg-[#FCFAF5] px-8 py-[18px]">
        <Button variant="secondary">Cancel</Button>
        <Button>Save changes</Button>
      </div>
    </>
  );
}
