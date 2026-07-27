import { requireSessionUser } from "@/lib/auth/session";
import { changePasswordAction } from "@/lib/auth/actions";
import { SettingsTabs } from "@/components/recruiter/recruiter-ui";
import { Button } from "@/components/ui/button";

export default async function SettingsPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  await requireSessionUser();
  const { error, saved } = await searchParams;

  return (
    <>
      <div className="px-8 pt-[22px]">
        <h1 className="font-display text-[28px] font-medium leading-none">Settings</h1>
        <SettingsTabs active="password" />
      </div>

      <div className="px-8 py-[26px]">
        <div className="w-full md:w-[calc(50%-0.375rem)] rounded-2xl border border-hairline p-6">
          <h2 className="text-[15px] font-semibold">Password</h2>
          <p className="mt-1.5 text-[13px] text-muted">
            Change the password you use to sign in to Talang Flow.
          </p>

          {saved && (
            <p className="mt-4 rounded-[10px] bg-primary-tint px-3 py-2.5 text-sm font-medium text-primary">
              Password updated.
            </p>
          )}
          {error === "current" && (
            <p className="mt-4 rounded-[10px] bg-[#FDF5F0] px-3 py-2.5 text-sm font-medium text-pass">
              Current password is incorrect.
            </p>
          )}
          {error === "mismatch" && (
            <p className="mt-4 rounded-[10px] bg-[#FDF5F0] px-3 py-2.5 text-sm font-medium text-pass">
              New passwords do not match.
            </p>
          )}
          {error === "invalid" && (
            <p className="mt-4 rounded-[10px] bg-[#FDF5F0] px-3 py-2.5 text-sm font-medium text-pass">
              New password must be at least 8 characters.
            </p>
          )}

          <form action={changePasswordAction} className="mt-5 space-y-4">
            <label className="block text-[12.5px] font-semibold text-muted">
              Current password
              <input
                type="password"
                name="currentPassword"
                required
                autoComplete="current-password"
                className="mt-1.5 w-full rounded-[10px] border border-[#E4DDCD] px-3 py-2.5 text-sm font-medium"
              />
            </label>
            <label className="block text-[12.5px] font-semibold text-muted">
              New password
              <input
                type="password"
                name="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="mt-1.5 w-full rounded-[10px] border border-[#E4DDCD] px-3 py-2.5 text-sm font-medium"
              />
            </label>
            <label className="block text-[12.5px] font-semibold text-muted">
              Confirm new password
              <input
                type="password"
                name="confirmPassword"
                required
                minLength={8}
                autoComplete="new-password"
                className="mt-1.5 w-full rounded-[10px] border border-[#E4DDCD] px-3 py-2.5 text-sm font-medium"
              />
            </label>
            <Button type="submit">Update password</Button>
          </form>
        </div>
      </div>
    </>
  );
}
