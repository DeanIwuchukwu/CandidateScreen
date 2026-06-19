import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-[10px] border border-[#E4DDCD] bg-surface px-3.5 py-3 text-sm font-medium text-ink placeholder:text-faint-2 outline-none transition-colors focus:border-primary",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
