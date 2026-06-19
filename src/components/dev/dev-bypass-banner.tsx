export function DevBypassBanner() {
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
      <strong>Dev preview mode</strong> — no database or login required. Remove{" "}
      <code className="rounded bg-amber-100 px-1">DEV_BYPASS_AUTH=true</code> from{" "}
      <code className="rounded bg-amber-100 px-1">.env</code> before production.
    </div>
  );
}
