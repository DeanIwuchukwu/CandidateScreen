"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const ACCENT_COLORS = ["#1C6B47", "#2A6FDB", "#B5503D", "#6B4E8A", "#19211B"];

export function WorkspaceSettingsForm({
  workspace,
  canEdit,
  action,
}: {
  workspace: {
    name: string;
    careersUrl: string | null;
    accentColor: string;
    logoUrl: string | null;
  };
  canEdit: boolean;
  action: (formData: FormData) => Promise<void>;
}) {
  const [accentColor, setAccentColor] = useState(workspace.accentColor);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    workspace.logoUrl,
  );
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <div className="grid items-stretch gap-6 px-8 py-[26px] lg:grid-cols-[1.1fr_0.9fr]">
        <form
          action={action}
          id="branding"
          encType="multipart/form-data"
          className="flex h-full flex-col scroll-mt-24 rounded-2xl border border-hairline p-6"
        >
          <h2 className="mb-[18px] text-[15px] font-semibold">Company profile</h2>
          <div className="mb-5 flex items-center gap-4">
            {logoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoPreview}
                alt=""
                className="h-[60px] w-[60px] rounded-[14px] object-cover"
              />
            ) : (
              <div
                className="grid h-[60px] w-[60px] place-items-center rounded-[14px] text-2xl font-bold text-white"
                style={{ backgroundColor: accentColor }}
              >
                {workspace.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <input
                ref={fileRef}
                type="file"
                name="logo"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                disabled={!canEdit}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setLogoPreview(URL.createObjectURL(file));
                }}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!canEdit}
                onClick={() => fileRef.current?.click()}
              >
                Upload logo
              </Button>
              <p className="mt-1.5 text-[11.5px] font-medium text-faint-2">
                PNG, JPG, WebP or SVG
              </p>
            </div>
          </div>
          <label className="mb-4 block text-[12.5px] font-semibold text-muted">
            Company name
            <input
              name="name"
              defaultValue={workspace.name}
              disabled={!canEdit}
              className="mt-1.5 w-full rounded-[10px] border border-[#E4DDCD] px-3 py-2.5 text-sm font-medium disabled:bg-paper-2"
            />
          </label>
          <label className="block text-[12.5px] font-semibold text-muted">
            Careers page URL
            <input
              name="careersUrl"
              defaultValue={workspace.careersUrl ?? ""}
              placeholder="https://company.com/careers"
              disabled={!canEdit}
              className="mt-1.5 w-full rounded-[10px] border border-[#E4DDCD] px-3 py-2.5 text-sm font-medium disabled:bg-paper-2"
            />
          </label>
          <input type="hidden" name="accentColor" value={accentColor} />
        </form>

        <div className="flex h-full flex-col gap-[22px]">
          <div className="mt-auto rounded-2xl border border-hairline p-6">
            <h2 className="text-[15px] font-semibold">Brand accent</h2>
            <p className="mt-1.5 text-[13px] text-muted">
              Shown to candidates on the interview pages.
            </p>
            <div className="mt-4 flex gap-3">
              {ACCENT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  disabled={!canEdit}
                  aria-label={`Select accent ${color}`}
                  onClick={() => setAccentColor(color)}
                  className="h-[42px] w-[42px] rounded-[10px] disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: color,
                    boxShadow:
                      color.toLowerCase() === accentColor.toLowerCase()
                        ? `0 0 0 2px #fff, 0 0 0 4px ${color}`
                        : undefined,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {canEdit && (
        <div className="flex items-center justify-end gap-3 border-t border-hairline-3 bg-[#FCFAF5] px-8 py-[18px]">
          <Button form="branding" type="submit">
            Save changes
          </Button>
        </div>
      )}
    </>
  );
}
