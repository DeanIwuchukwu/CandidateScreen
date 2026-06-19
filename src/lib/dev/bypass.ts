/** Dev-only: skip login and database — set DEV_BYPASS_AUTH=true in .env */
export function isDevBypass(): boolean {
  return (
    process.env.DEV_BYPASS_AUTH === "true" && process.env.NODE_ENV !== "production"
  );
}
