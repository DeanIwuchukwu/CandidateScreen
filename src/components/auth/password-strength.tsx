"use client";

function scorePassword(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  return Math.min(4, score);
}

const labels = ["Weak", "Fair", "Good", "Strong", "Strong"] as const;

export function PasswordStrength({ password }: { password: string }) {
  const score = scorePassword(password);
  const label = labels[score];

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-colors"
            style={{
              backgroundColor: i < score ? "#1C6B47" : "#E4DDCD",
            }}
          />
        ))}
      </div>
      {password.length > 0 && (
        <p className="mt-1.5 text-[12px] font-semibold text-primary">{label}</p>
      )}
    </div>
  );
}
