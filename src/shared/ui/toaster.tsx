"use client";

import { cn } from "@/shared/lib/cn";
import { useToastStore } from "@/shared/stores/toast.store";

function ToastIcon({ type }: { type: "success" | "error" }) {
  if (type === "success") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4">
        <path d="m5 12 4 4 10-10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4">
      <path d="M12 8v5" strokeLinecap="round" />
      <circle cx="12" cy="16.7" r="0.9" fill="currentColor" stroke="none" />
      <path d="M12 3.5 21 19H3l9-15.5Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div className="pointer-events-none fixed right-5 top-5 z-[100] flex w-full max-w-sm flex-col gap-2.5">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "overflow-hidden rounded-2xl border bg-white/95 shadow-[0_20px_40px_-28px_rgba(15,23,42,0.45)] backdrop-blur",
            toast.type === "success"
              ? "border-emerald-200/80 text-emerald-950"
              : "border-rose-200/80 text-rose-950"
          )}
        >
          <div className="flex items-start gap-3 px-4 py-3.5">
            <div
              className={cn(
                "mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                toast.type === "success" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
              )}
            >
              <ToastIcon type={toast.type} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-relaxed text-slate-800">{toast.message}</p>
            </div>
          </div>
          <div className={cn("h-1 w-full", toast.type === "success" ? "bg-emerald-400/70" : "bg-rose-400/70")} />
        </div>
      ))}
    </div>
  );
}
