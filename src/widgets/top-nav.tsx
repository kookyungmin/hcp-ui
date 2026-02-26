"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { BrandLogo } from "@/shared/ui/brand-logo";

const navItems = [
  { label: "요금", href: "#pricing" },
  { label: "고객지원", href: "#support" },
  { label: "가이드센터", href: "#guide" }
];

const serviceMenuItems = [
  {
    id: "vm",
    category: "Compute",
    name: "VM 관리",
    description: "Linux/Windows 인스턴스 운영 및 Scale Up/Down",
    href: "/?service=vm#services"
  },
  {
    id: "db",
    category: "Database",
    name: "DB 관리",
    description: "백업/복구와 성능 지표를 포함한 데이터베이스 운영",
    href: "/?service=db#services"
  },
  {
    id: "vpc",
    category: "Network",
    name: "VPC 관리",
    description: "VPC, Subnet, Routing, Security Group 정책 관리",
    href: "/?service=vpc#services"
  },
  {
    id: "object-storage",
    category: "Storage",
    name: "Object Storage",
    description: "버킷 정책, 접근 제어, 수명주기 설정",
    href: "/?service=object-storage#services"
  },
  {
    id: "iam",
    category: "Security",
    name: "IAM 관리",
    description: "서브 계정과 RBAC 권한 관리",
    href: "/?service=iam#services"
  },
  {
    id: "serverless",
    category: "Platform",
    name: "Functions",
    description: "Runtime Runner와 API Generator 기반 함수 실행",
    href: "/?service=serverless#services"
  },
  {
    id: "observability",
    category: "Ops",
    name: "Observability",
    description: "메트릭/로그/알람 통합 관측",
    href: "/?service=observability#services"
  }
];

export function TopNav() {
  const [open, setOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(serviceMenuItems[0].id);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedService = serviceMenuItems.find((item) => item.id === selectedServiceId) ?? serviceMenuItems[0];

  const openMenu = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpen(true);
  };

  const scheduleCloseMenu = () => {
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
    }, 130);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 md:px-8">
        <Link href="/" aria-label="Happy Cloud 홈으로 이동">
          <BrandLogo size="sm" />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          <div className="relative" onMouseEnter={openMenu} onMouseLeave={scheduleCloseMenu}>
            <a href="#services" className="text-sm font-semibold text-slate-900 transition hover:text-[#1376f8]">
              서비스
            </a>

            {open ? (
              <div className="absolute left-1/2 top-full w-[1280px] -translate-x-1/2 pt-3" onMouseEnter={openMenu} onMouseLeave={scheduleCloseMenu}>
                <div className="rounded-3xl border border-slate-200 bg-[#f3f4f7] p-6 text-slate-900 shadow-[0_28px_55px_-35px_rgba(15,23,42,0.55)]">
                  <div className="grid min-h-[460px] gap-6 lg:grid-cols-[220px_1fr]">
                    <aside className="rounded-2xl bg-gradient-to-b from-slate-700 to-slate-600 p-4 text-slate-100">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-200">Service Categories</p>
                      <ul className="mt-3 space-y-2">
                        {serviceMenuItems.map((item) => (
                          <li key={item.id}>
                            <button
                              type="button"
                              onClick={() => setSelectedServiceId(item.id)}
                              className={`block w-full rounded-lg px-2 py-1.5 text-left text-sm font-medium transition ${
                                selectedServiceId === item.id ? "bg-white/20 text-white" : "text-slate-100 hover:bg-white/15"
                              }`}
                            >
                              {item.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </aside>

                    <div className="w-full">
                      <article className="flex min-h-[230px] w-[320px] flex-col rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#1376f8]">{selectedService.category}</p>
                        <h3 className="pt-1 text-base font-semibold text-slate-900">{selectedService.name}</h3>
                        <p className="pt-1 text-sm leading-relaxed text-slate-600">{selectedService.description}</p>
                        <div className="mt-auto flex gap-2 pt-4">
                          <button
                            type="button"
                            className="inline-flex h-8 items-center rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-800 transition hover:bg-slate-100"
                          >
                            상세 보기
                          </button>
                          <button
                            type="button"
                            className="inline-flex h-8 items-center rounded-lg bg-slate-900 px-2.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                          >
                            콘솔 이동
                          </button>
                        </div>
                      </article>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {navItems.map((item) => (
            <a key={item.label} href={item.href} className="text-sm font-medium text-slate-700 transition hover:text-slate-950">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/auth/sign-in"
            className="inline-flex h-10 items-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
          >
            로그인
          </Link>
          <Link
            href="/auth/sign-up"
            className="inline-flex h-10 items-center rounded-xl bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            회원가입
          </Link>
        </div>
      </div>
    </header>
  );
}
