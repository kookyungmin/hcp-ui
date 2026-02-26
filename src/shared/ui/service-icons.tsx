import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const baseClassName = "h-10 w-10";

export function VmIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={baseClassName} fill="none" {...props}>
      <rect x="6" y="8" width="36" height="24" rx="7" fill="#2F80ED" />
      <rect x="12" y="14" width="24" height="12" rx="3" fill="#B9DBFF" />
      <rect x="18" y="34" width="12" height="3" rx="1.5" fill="#1B4FA8" />
    </svg>
  );
}

export function DbIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={baseClassName} fill="none" {...props}>
      <ellipse cx="24" cy="12" rx="14" ry="6" fill="#FF9A62" />
      <path d="M10 12v16c0 3.3 6.3 6 14 6s14-2.7 14-6V12" fill="#FF6B4A" />
      <ellipse cx="24" cy="28" rx="14" ry="6" fill="#FF8552" />
    </svg>
  );
}

export function VpcIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={baseClassName} fill="none" {...props}>
      <rect x="6" y="10" width="14" height="11" rx="3" fill="#4B79F2" />
      <rect x="28" y="10" width="14" height="11" rx="3" fill="#5E89FA" />
      <rect x="17" y="27" width="14" height="11" rx="3" fill="#345DCC" />
      <path d="M20 16h8M24 21v6" stroke="#B9D2FF" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function StorageIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={baseClassName} fill="none" {...props}>
      <path d="M24 6 8 14l16 8 16-8-16-8Z" fill="#57C6FF" />
      <path d="m8 22 16 8 16-8" stroke="#2F80ED" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m8 30 16 8 16-8" stroke="#1F5FC9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IamIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={baseClassName} fill="none" {...props}>
      <circle cx="21" cy="17" r="7" fill="#42C2A2" />
      <path d="M9 36c0-6.6 5.4-12 12-12s12 5.4 12 12" fill="#2A9D84" />
      <rect x="29" y="18" width="12" height="16" rx="3" fill="#1F6AFF" />
      <rect x="33" y="23" width="4" height="7" rx="1" fill="#BFE0FF" />
    </svg>
  );
}

export function ServerlessIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={baseClassName} fill="none" {...props}>
      <path d="m26 6-12 16h8l-4 20 16-21h-8V6Z" fill="#7B6DFF" />
      <circle cx="34" cy="11" r="4" fill="#C7BEFF" />
    </svg>
  );
}

export function ObservabilityIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={baseClassName} fill="none" {...props}>
      <rect x="8" y="25" width="6" height="13" rx="2" fill="#2F80ED" />
      <rect x="18" y="18" width="6" height="20" rx="2" fill="#57C6FF" />
      <rect x="28" y="12" width="6" height="26" rx="2" fill="#4C9FFF" />
      <rect x="38" y="8" width="6" height="30" rx="2" fill="#1F5FC9" />
    </svg>
  );
}
