import { requireWorkspaceProduct } from "@/lib/workspace/product-actions";

export default async function JobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireWorkspaceProduct("jobs");
  return children;
}
