"use client";

import { cn } from "@/lib/utils";

export function StarRating({
  value,
  onChange,
  max = 5,
  size = 18,
  readOnly = false,
}: {
  value: number;
  onChange?: (value: number) => void;
  max?: number;
  size?: number;
  readOnly?: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-1">
      {Array.from({ length: max }, (_, i) => {
        const filled = i < value;
        return (
          <button
            key={i}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(i + 1)}
            className={cn(!readOnly && "cursor-pointer")}
            aria-label={`Rate ${i + 1} of ${max}`}
          >
            <svg width={size} height={size} viewBox="0 0 24 24">
              <polygon
                points="12 2 15 9 22 9.3 16.5 14 18.5 21 12 17 5.5 21 7.5 14 2 9.3 9 9"
                fill={filled ? "#1C6B47" : "#DDD7C8"}
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
