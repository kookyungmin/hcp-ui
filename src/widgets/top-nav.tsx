"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SERVICE_CATEGORIES } from "@/shared/constants/service-catalog";
import { hasRolePermission, PERMISSIONS } from "@/shared/lib/permission";
import { useAuthStore } from "@/shared/stores/auth.store";
import { useToastStore } from "@/shared/stores/toast.store";
import { BrandLogo } from "@/shared/ui/brand-logo";

const navItems = [
  { label: "요금", href: "#pricing" },
  { label: "고객지원", href: "#support" },
  { label: "가이드센터", href: "#guide" }
];

export function TopNav() {
  const router = useRouter();
  const loginUser = useAuthStore((state) => state.loginUser);
  const initialized = useAuthStore((state) => state.initialized);
  const isInitializing = useAuthStore((state) => state.isInitializing);
  const logout = useAuthStore((state) => state.logout);
  const showToast = useToastStore((state) => state.showToast);
  const canReadServerInstance = hasRolePermission(loginUser?.roles, PERMISSIONS.SERVER_INSTANCE_READ);

  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(SERVICE_CATEGORIES[0].id);

  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const profileWrapperRef = useRef<HTMLDivElement | null>(null);

  const selectedCategory = SERVICE_CATEGORIES.find((item) => item.id === selectedCategoryId) ?? SERVICE_CATEGORIES[0];

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

  const onUnsupportedClick = () => {
    showToast("error", "권한이 없습니다.");
  };

  const onGoConsole = () => {
    if (!canReadServerInstance) {
      onUnsupportedClick();
      return;
    }
    router.push("/console?category=compute&service=server");
  };

  const onGoConsoleByMenu = (categoryId: string, serviceId: string) => {
    const canEnterConsole = categoryId === "compute" && serviceId === "server" && canReadServerInstance;
    if (!canEnterConsole) {
      onUnsupportedClick();
      return;
    }

    router.push("/console?category=compute&service=server");
  };

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (!profileOpen) return;

      const target = event.target as Node;
      if (profileWrapperRef.current && !profileWrapperRef.current.contains(target)) {
        setProfileOpen(false);
      }
    };

    window.addEventListener("mousedown", onMouseDown);
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
    };
  }, [profileOpen]);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 md:px-8">
        <Link href="/" aria-label="Happy Cloud 홈으로 이동">
          <BrandLogo size="sm" />
        </Link>

        {!initialized || isInitializing ? (
          <div className="hidden h-6 w-[380px] md:block" aria-hidden="true" />
        ) : (
          <nav className="hidden items-center gap-7 md:flex">
            <div className="relative" onMouseEnter={openMenu} onMouseLeave={scheduleCloseMenu}>
              <button
                type="button"
                onClick={openMenu}
                className="text-sm font-semibold text-slate-900 transition hover:text-[#1376f8]"
              >
                서비스
              </button>

              {open ? (
                <div className="absolute left-1/2 top-full w-[1280px] -translate-x-1/2 pt-3" onMouseEnter={openMenu} onMouseLeave={scheduleCloseMenu}>
                  <div className="rounded-3xl border border-slate-200 bg-[#f3f4f7] p-6 text-slate-900 shadow-[0_28px_55px_-35px_rgba(15,23,42,0.55)]">
                    <div className="grid min-h-[460px] gap-6 lg:grid-cols-[220px_1fr]">
                      <aside className="rounded-2xl bg-gradient-to-b from-slate-700 to-slate-600 p-4 text-slate-100">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-200">Service Categories</p>
                        <ul className="mt-3 space-y-2">
                          {SERVICE_CATEGORIES.map((category) => (
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
                                  onClick={onUnsupportedClick}
                                  className="inline-flex h-8 items-center rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-800 transition hover:bg-slate-100"
                                >
                                  상세 보기
                                </button>
                                {loginUser ? (
                                  <button
                                    type="button"
                                    onClick={() => onGoConsoleByMenu(selectedCategory.id, service.id)}
                                    className="inline-flex h-8 items-center rounded-lg bg-slate-900 px-2.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                                  >
                                    콘솔 이동
                                  </button>
                                ) : null}
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
        )}

        {!initialized || isInitializing ? (
          <div className="h-10 w-[170px]" aria-hidden="true" />
        ) : loginUser ? (
          <div ref={profileWrapperRef} className="relative flex items-center gap-2">
            <button
              type="button"
              onClick={onGoConsole}
              className="inline-flex h-10 items-center rounded-xl bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              콘솔로 이동
            </button>

            <button
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-sm font-semibold text-slate-900"
              aria-label="사용자 프로필"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-slate-700" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5 19a7 7 0 0 1 14 0" strokeLinecap="round" />
              </svg>
            </button>

            {profileOpen ? (
              <div className="absolute right-0 top-12 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_20px_40px_-28px_rgba(15,23,42,0.45)]">
                <p className="text-sm font-semibold text-slate-900">{loginUser.displayName}</p>
                <p className="text-xs text-slate-600">{loginUser.email}</p>
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    setProfileOpen(false);
                  }}
                  className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                >
                  로그아웃
                </button>
              </div>
            ) : null}
          </div>
        ) : (
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
        )}
      </div>
    </header>
  );
}
