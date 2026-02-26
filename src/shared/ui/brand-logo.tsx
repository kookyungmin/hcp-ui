import type { SVGProps } from "react";
import { cn } from "@/shared/lib/cn";

type BrandLogoProps = {
  size?: "sm" | "md";
  className?: string;
};

function LogoMark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className={className} {...props}>
      <rect x="6" y="8" width="36" height="32" rx="8" stroke="currentColor" strokeWidth="2.6" />
      <path d="M15 17v14M33 17v14M15 24h18" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BrandLogo({ size = "md", className }: BrandLogoProps) {
  const markSize = size === "sm" ? "h-7 w-7" : "h-8 w-8";
  const textClass = size === "sm" ? "text-lg" : "text-xl";

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-slate-950", className)}>
      <LogoMark className={markSize} />
      <span className={cn("font-sora font-semibold tracking-tight", textClass)}>Happy Cloud</span>
    </span>
  );
}
