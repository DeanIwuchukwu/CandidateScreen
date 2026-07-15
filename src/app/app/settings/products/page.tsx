import { requireSessionUser } from "@/lib/auth/session";
import { getUserWorkspace } from "@/lib/recruiter/queries";
import {
  setProductEnabledAction,
} from "@/lib/workspace/product-actions";
import {
  WORKSPACE_PRODUCTS,
  hasProduct,
} from "@/lib/workspace/products";
import { isAdmin } from "@/lib/team/permissions";
import { SettingsTabs } from "@/components/recruiter/recruiter-ui";
import { Button } from "@/components/ui/button";

export default async function ProductsSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireSessionUser();
  const membership = await getUserWorkspace(user.id);
  const { workspace, role } = membership;
  const { error } = await searchParams;
  const canEdit = isAdmin(role);

  return (
    <>
      <div className="px-8 pt-[22px]">
        <h1 className="font-display text-[28px] font-medium leading-none">Settings</h1>
        <SettingsTabs active="products" />
      </div>

      <div className="px-8 py-[26px]">
        <p className="max-w-xl text-[14px] leading-relaxed text-muted">
          Add products to your workspace to show them in the sidebar.
        </p>

        {error === "forbidden" && (
          <p className="mt-4 rounded-[10px] bg-[#FDF5F0] px-3 py-2.5 text-sm font-medium text-pass">
            Only admins can change products.
          </p>
        )}

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {WORKSPACE_PRODUCTS.map((product) => {
            const enabled = hasProduct(workspace.enabledProducts, product.id);
            return (
              <div
                key={product.id}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-hairline bg-surface px-5 py-4"
              >
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold">{product.label}</div>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">
                    {product.description}
                  </p>
                  {enabled && (
                    <p className="mt-2 text-[12px] font-semibold text-primary">
                      Added · visible in navigation
                    </p>
                  )}
                </div>
                {canEdit ? (
                  <form action={setProductEnabledAction} className="self-start">
                    <input type="hidden" name="productId" value={product.id} />
                    <input
                      type="hidden"
                      name="intent"
                      value={enabled ? "disable" : "enable"}
                    />
                    <Button
                      type="submit"
                      variant={enabled ? "secondary" : "primary"}
                      size="sm"
                    >
                      {enabled ? "Remove" : "Add"}
                    </Button>
                  </form>
                ) : (
                  <span className="text-[12.5px] font-semibold text-faint">
                    {enabled ? "Added" : "Not added"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
