import Link from "next/link";
import { BrandLogo } from "@/shared/ui/brand-logo";

const footerLinks = [
  { label: "서비스 이용약관", href: "#" },
  { label: "개인정보 처리방침", href: "#" },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white/95">
      <div className="mx-auto w-full max-w-[1320px] px-5 py-10 md:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <BrandLogo size="sm" />
            <p className="text-sm text-slate-600">안정적이고 확장 가능한 클라우드 운영 콘솔</p>
            <p className="text-xs text-slate-500">© {new Date().getFullYear()} Happy Cloud Platform. All rights reserved.</p>
          </div>

          <nav className="flex flex-wrap gap-2">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
