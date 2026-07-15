import { requireWorkspaceProduct } from "@/lib/workspace/product-actions";

export default async function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireWorkspaceProduct("analytics");
  return children;
}
