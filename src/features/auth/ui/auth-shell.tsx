import type { ReactNode } from "react";
import Link from "next/link";
import { BrandLogo } from "@/shared/ui/brand-logo";
import Image from "next/image";

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden px-5 py-10 md:px-8 md:py-14">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,rgba(59,130,246,0.15),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.12),transparent_35%)]" />

      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1fr_1fr] lg:items-stretch">
        <section className="hidden rounded-3xl border border-slate-200 bg-white/80 p-10 shadow-[0_18px_50px_-30px_rgba(2,6,23,0.45)] backdrop-blur lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-5">
            <Link href="/" aria-label="Happy Cloud 홈으로 이동">
              <BrandLogo />
            </Link>
            <h1 className="font-sora text-4xl font-semibold leading-tight text-slate-950">Enterprise Cloud Console</h1>
            <p className="text-base leading-relaxed text-slate-600">
              인증부터 인가, 운영까지 하나의 콘솔에서 관리할 수 있도록 설계된 클라우드 플랫폼 UI입니다.
            </p>
            <Image
                src="/images/hero-cloud-visual.svg"
                alt="클라우드 인프라 비주얼"
                width={800}
                height={600}
                className="h-auto w-full rounded-2xl"
                priority
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.13em] text-blue-700">Security Snapshot</p>
            <p className="pt-2 text-sm text-slate-700">OAuth2.0 로그인, RBAC 정책, 세션 감사 로그를 확장 가능한 구조로 연결할 수 있습니다.</p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-30px_rgba(2,6,23,0.45)] md:p-8 lg:p-10">
          <div className="space-y-2 pb-7">
            <h2 className="font-sora text-3xl font-semibold text-slate-950">{title}</h2>
            <p className="text-sm text-slate-600">{description}</p>
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}
