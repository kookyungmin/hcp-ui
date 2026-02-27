import type { InputHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export function Input({ className, label, hint, error, id, ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    <label htmlFor={inputId} className="flex w-full flex-col gap-2 text-sm font-medium text-slate-700">
      {label}
      <input
        id={inputId}
        className={cn(
          "h-11 rounded-xl border bg-white px-3 text-sm text-slate-900 outline-none transition focus:ring-2",
          error
            ? "border-red-400 focus:border-red-400 focus:ring-red-100"
            : "border-slate-300 focus:border-blue-500 focus:ring-blue-100",
          className
        )}
        {...props}
      />
      {error ? <span className="text-xs font-normal text-red-600">{error}</span> : null}
      {!error && hint ? <span className="text-xs font-normal text-slate-500">{hint}</span> : null}
    </label>
  );
}
