"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { BrandLogo } from "@/shared/ui/brand-logo";

const navItems = [
  { label: "요금", href: "#pricing" },
  { label: "고객지원", href: "#support" },
  { label: "가이드센터", href: "#guide" }
];

const serviceCategories = [
  {
    id: "compute",
    label: "Compute",
    services: [
      {
        id: "server",
        name: "Server",
        description: "Linux, Windows 인스턴스 생성, 스냅샷, 스케일 조정을 운영합니다."
      },
      {
        id: "funcations",
        name: "Functions",
        description: "Runtime Runner와 API Generator 기반 함수 실행을 지원합니다."
      }
    ]
  },
  {
    id: "database",
    label: "Database",
    services: [
      {
        id: "db-managed",
        name: "Database Server",
        description: "백업/복구와 성능 지표를 포함한 데이터베이스 운영 기능입니다."
      }
    ]
  },
  {
    id: "network",
    label: "Network",
    services: [
      {
        id: "vpc",
        name: "VPC 관리",
        description: "VPC, Subnet, Routing, Security Group 정책을 관리합니다."
      }
    ]
  },
  {
    id: "storage",
    label: "Storage",
    services: [
      {
        id: "object-storage",
        name: "Object Storage",
        description: "버킷 정책, 접근 제어, 수명주기 설정을 제공합니다."
      }
    ]
  },
  {
    id: "security",
    label: "Security",
    services: [
      {
        id: "iam",
        name: "IAM 관리",
        description: "서브 계정과 RBAC 권한을 역할 기반으로 관리합니다."
      }
    ]
  },
  {
    id: "observability",
    label: "Observability",
    services: [
      {
        id: "observability",
        name: "Observability",
        description: "메트릭/로그/알람을 통합 관측해 운영 가시성을 높입니다."
      }
    ]
  }
];

export function TopNav() {
  const [open, setOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(serviceCategories[0].id);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedCategory = serviceCategories.find((item) => item.id === selectedCategoryId) ?? serviceCategories[0];

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
                        {serviceCategories.map((category) => (
                          <li key={category.id}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCategoryId(category.id);
                              }}
                              className={`block w-full rounded-lg px-2 py-1.5 text-left text-sm font-medium transition ${
                                selectedCategoryId === category.id
                                  ? "bg-white/20 text-white"
                                  : "text-slate-100 hover:bg-white/15"
                              }`}
                            >
                              {category.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </aside>

                    <div className="w-full">
                      <div className="mb-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#1376f8]">
                          {selectedCategory.label}
                        </p>
                      </div>

                      <div className="grid w-[670px] grid-cols-2 gap-3">
                        {selectedCategory.services.map((service) => (
                          <article key={service.id} className="flex min-h-[230px] flex-col rounded-2xl border border-slate-200 bg-white p-4">
                            <h3 className="pt-1 text-base font-semibold text-slate-900">{service.name}</h3>
                            <p className="pt-2 text-sm leading-relaxed text-slate-600">{service.description}</p>
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
                        ))}
                      </div>
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
