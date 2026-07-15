export const WORKSPACE_PRODUCTS = [
  {
    id: "jobs",
    label: "Jobs",
    description: "Publish job listings, collect applicants, and invite them to interviews.",
    href: "/app/jobs",
  },
  {
    id: "analytics",
    label: "Analytics",
    description: "Track funnel completion, review pace, and interview performance.",
    href: "/app/analytics",
  },
  {
    id: "employees",
    label: "Employee management",
    description: "Keep a simple roster of people on your team beyond hiring.",
    href: "/app/employees",
  },
] as const;

export type WorkspaceProductId = (typeof WORKSPACE_PRODUCTS)[number]["id"];

export function isWorkspaceProductId(value: string): value is WorkspaceProductId {
  return WORKSPACE_PRODUCTS.some((product) => product.id === value);
}

export function hasProduct(
  enabledProducts: string[] | null | undefined,
  productId: WorkspaceProductId,
) {
  return Boolean(enabledProducts?.includes(productId));
}

export function getProduct(productId: WorkspaceProductId) {
  return WORKSPACE_PRODUCTS.find((product) => product.id === productId)!;
}
