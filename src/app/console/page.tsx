"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandLogo } from "@/shared/ui/brand-logo";
import { SERVICE_CATEGORIES } from "@/shared/constants/service-catalog";
import { useAuthStore } from "@/shared/stores/auth.store";
import { useToastStore } from "@/shared/stores/toast.store";
import { hasServicePermission } from "@/shared/lib/permission";

function CategoryIcon({ id }: { id: string }) {
  switch (id) {
    case "compute":
      return (
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="4" width="14" height="9" rx="1.8" />
          <path d="M7 16h6" />
        </svg>
      );
    case "database":
      return (
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <ellipse cx="10" cy="5" rx="4.5" ry="2" />
          <path d="M5.5 5v6c0 1.1 2 2 4.5 2s4.5-.9 4.5-2V5" />
        </svg>
      );
    case "network":
      return (
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="2.5" y="3" width="5" height="5" rx="1.2" />
          <rect x="12.5" y="3" width="5" height="5" rx="1.2" />
          <rect x="7.5" y="12" width="5" height="5" rx="1.2" />
          <path d="M7.5 5.5h5M10 8v4" />
        </svg>
      );
    case "storage":
      return (
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="m3 6 7-3 7 3-7 3-7-3Z" />
          <path d="m3 10 7 3 7-3M3 13.5l7 3 7-3" />
        </svg>
      );
    case "security":
      return (
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M10 2.5 4.5 5v4.6c0 3.2 2.1 5.9 5.5 7 3.4-1.1 5.5-3.8 5.5-7V5L10 2.5Z" />
          <path d="M8.3 10.1 9.6 11.4l2.4-2.4" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 15V5M8 15V8M13 15v-4M18 15V3" />
        </svg>
      );
  }
}

type ServerInstance = {
  instanceId: string;
  name: string;
  status: "running" | "stopped" | "rebooting";
  tags: string[];
  osName: string;
  osVersion: string;
  cpuCores: number;
  memorySizeGb: number;
  storageSizeGb: number;
  publicIp: string;
  privateIp: string;
  vpcName: string;
};

const MOCK_INSTANCES: ServerInstance[] = [
  {
    instanceId: "i-0a12b34c56d78ef90",
    name: "web-prod-1",
    status: "running",
    tags: ["prod", "frontend", "critical"],
    osName: "Ubuntu",
    osVersion: "22.04 LTS",
    cpuCores: 4,
    memorySizeGb: 8,
    storageSizeGb: 120,
    publicIp: "52.79.120.44",
    privateIp: "10.0.12.34",
    vpcName: "vpc-main-prod"
  },
  {
    instanceId: "i-0123ab45cd67ef890",
    name: "api-stg-2",
    status: "stopped",
    tags: ["staging", "api"],
    osName: "Rocky Linux",
    osVersion: "9.4",
    cpuCores: 2,
    memorySizeGb: 4,
    storageSizeGb: 80,
    publicIp: "-",
    privateIp: "10.0.21.17",
    vpcName: "vpc-main-stg"
  },
  {
    instanceId: "i-06db6c3a49e88fa12",
    name: "worker-prod-1",
    status: "running",
    tags: ["prod", "worker", "batch"],
    osName: "Ubuntu",
    osVersion: "20.04 LTS",
    cpuCores: 8,
    memorySizeGb: 16,
    storageSizeGb: 200,
    publicIp: "13.124.51.12",
    privateIp: "10.0.14.9",
    vpcName: "vpc-main-prod"
  },
  {
    instanceId: "i-0b21f0abce55d921f",
    name: "bastion-ops",
    status: "running",
    tags: ["ops", "security"],
    osName: "Amazon Linux",
    osVersion: "2023",
    cpuCores: 2,
    memorySizeGb: 4,
    storageSizeGb: 60,
    publicIp: "3.37.112.22",
    privateIp: "10.0.1.8",
    vpcName: "vpc-shared-ops"
  },
  {
    instanceId: "i-053f3f64ca9f2140f",
    name: "db-proxy-1",
    status: "rebooting",
    tags: ["prod", "database", "proxy"],
    osName: "Ubuntu",
    osVersion: "22.04 LTS",
    cpuCores: 4,
    memorySizeGb: 8,
    storageSizeGb: 100,
    publicIp: "-",
    privateIp: "10.0.31.11",
    vpcName: "vpc-data-prod"
  },
  {
    instanceId: "i-0e3d42b654bb389f3",
    name: "qa-api-1",
    status: "stopped",
    tags: ["qa", "api"],
    osName: "Rocky Linux",
    osVersion: "8.9",
    cpuCores: 2,
    memorySizeGb: 4,
    storageSizeGb: 80,
    publicIp: "43.202.15.209",
    privateIp: "10.0.22.41",
    vpcName: "vpc-main-qa"
  },
  {
    instanceId: "i-0c9a47fefcf84f1a1",
    name: "web-dev-3",
    status: "running",
    tags: ["dev", "frontend"],
    osName: "Ubuntu",
    osVersion: "22.04 LTS",
    cpuCores: 2,
    memorySizeGb: 4,
    storageSizeGb: 50,
    publicIp: "15.164.77.10",
    privateIp: "10.0.42.16",
    vpcName: "vpc-main-dev"
  },
  {
    instanceId: "i-0de46109a4db9d991",
    name: "jenkins-build",
    status: "running",
    tags: ["ci", "build", "ops"],
    osName: "Ubuntu",
    osVersion: "22.04 LTS",
    cpuCores: 4,
    memorySizeGb: 16,
    storageSizeGb: 300,
    publicIp: "52.78.32.130",
    privateIp: "10.0.3.21",
    vpcName: "vpc-shared-ops"
  },
  {
    instanceId: "i-0247e7cb124bc58a4",
    name: "cache-proxy-1",
    status: "running",
    tags: ["prod", "cache"],
    osName: "Amazon Linux",
    osVersion: "2",
    cpuCores: 2,
    memorySizeGb: 8,
    storageSizeGb: 80,
    publicIp: "-",
    privateIp: "10.0.33.18",
    vpcName: "vpc-data-prod"
  },
  {
    instanceId: "i-0a7dd70cb4a259f12",
    name: "log-collector",
    status: "rebooting",
    tags: ["observability", "prod"],
    osName: "Ubuntu",
    osVersion: "20.04 LTS",
    cpuCores: 4,
    memorySizeGb: 8,
    storageSizeGb: 150,
    publicIp: "-",
    privateIp: "10.0.70.6",
    vpcName: "vpc-observe-prod"
  },
  {
    instanceId: "i-046f3f3f2f11b3aa0",
    name: "dev-testbox",
    status: "stopped",
    tags: ["dev", "sandbox"],
    osName: "Windows Server",
    osVersion: "2022",
    cpuCores: 2,
    memorySizeGb: 8,
    storageSizeGb: 120,
    publicIp: "54.180.201.77",
    privateIp: "10.0.52.73",
    vpcName: "vpc-main-dev"
  }
];

export default function ConsolePage() {
  const SIDEBAR_COLLAPSE_BREAKPOINT = 1500;
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginUser = useAuthStore((state) => state.loginUser);
  const initialized = useAuthStore((state) => state.initialized);
  const isInitializing = useAuthStore((state) => state.isInitializing);
  const logout = useAuthStore((state) => state.logout);
  const showToast = useToastStore((state) => state.showToast);

  const [activeCategoryId, setActiveCategoryId] = useState("compute");
  const [activeServiceId, setActiveServiceId] = useState("server");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < SIDEBAR_COLLAPSE_BREAKPOINT : false
  );
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>(() =>
    SERVICE_CATEGORIES.reduce<Record<string, boolean>>((acc, category) => {
      acc[category.id] = false;
      return acc;
    }, {})
  );
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [operationDropdownOpen, setOperationDropdownOpen] = useState(false);
  const profileWrapperRef = useRef<HTMLDivElement | null>(null);
  const operationDropdownRef = useRef<HTMLDivElement | null>(null);
  const readPermissionDeniedRef = useRef(false);
  const instances = MOCK_INSTANCES;
  const firstReadableTarget = useMemo(() => {
    for (const category of SERVICE_CATEGORIES) {
      for (const service of category.services) {
        if (hasServicePermission(loginUser?.roles, category.id, service.id, "read")) {
          return { categoryId: category.id, serviceId: service.id };
        }
      }
    }

    return null;
  }, [loginUser?.roles]);
  const fallbackTarget = firstReadableTarget ?? { categoryId: "compute", serviceId: "server" };
  const canReadService = hasServicePermission(loginUser?.roles, activeCategoryId, activeServiceId, "read");
  const canExecuteService = hasServicePermission(loginUser?.roles, activeCategoryId, activeServiceId, "execute");
  const canWriteService = hasServicePermission(loginUser?.roles, activeCategoryId, activeServiceId, "write");

  useEffect(() => {
    if (initialized && !isInitializing && !loginUser) {
      router.replace("/auth/sign-in");
    }
  }, [initialized, isInitializing, loginUser, router]);

  useEffect(() => {
    if (!initialized || isInitializing || !loginUser) return;
    if (canReadService || readPermissionDeniedRef.current) return;

    if (firstReadableTarget) {
      setActiveCategoryId(firstReadableTarget.categoryId);
      setActiveServiceId(firstReadableTarget.serviceId);
      return;
    }

    readPermissionDeniedRef.current = true;
    showToast("error", "권한이 없습니다.");
    router.replace("/");
  }, [initialized, isInitializing, loginUser, canReadService, firstReadableTarget, showToast, router]);

  const activeCategory = useMemo(
    () => SERVICE_CATEGORIES.find((category) => category.id === activeCategoryId) ?? SERVICE_CATEGORIES[0],
    [activeCategoryId]
  );
  const activeService =
    activeCategory.services.find((service) => service.id === activeServiceId) ?? activeCategory.services[0];
  const pageSize = 10;
  const hasSelectedInstance = Boolean(activeRowId);
  const filteredInstances = useMemo(() => {
    const query = searchKeyword.trim().toLowerCase();
    if (!query) return instances;

    return instances.filter((instance) => {
      const byName = instance.name.toLowerCase().includes(query);
      const byTag = instance.tags.some((tag) => tag.toLowerCase().includes(query));
      return byName || byTag;
    });
  }, [instances, searchKeyword]);
  const totalPages = Math.max(1, Math.ceil(filteredInstances.length / pageSize));
  const pagedInstances = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInstances.slice(start, start + pageSize);
  }, [filteredInstances, currentPage]);
  const emptyRowCount = Math.max(0, pageSize - pagedInstances.length - (pagedInstances.length === 0 ? 1 : 0));
  const visiblePages = useMemo(() => {
    const pages = [1];
    if (totalPages >= 2) pages.push(2);
    return pages;
  }, [totalPages]);

  useEffect(() => {
    const updateSidebarCollapsed = () => {
      setSidebarCollapsed(window.innerWidth < SIDEBAR_COLLAPSE_BREAKPOINT);
    };

    updateSidebarCollapsed();
    window.addEventListener("resize", updateSidebarCollapsed);
    return () => {
      window.removeEventListener("resize", updateSidebarCollapsed);
    };
  }, []);

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (profileOpen && profileWrapperRef.current && !profileWrapperRef.current.contains(target)) {
        setProfileOpen(false);
      }
      if (operationDropdownOpen && operationDropdownRef.current && !operationDropdownRef.current.contains(target)) {
        setOperationDropdownOpen(false);
      }
    };

    window.addEventListener("mousedown", onMouseDown);
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
    };
  }, [profileOpen, operationDropdownOpen]);

  useEffect(() => {
    if (!activeCategory.services.some((service) => service.id === activeServiceId)) {
      setActiveServiceId(activeCategory.services[0]?.id ?? "");
    }
  }, [activeCategory, activeServiceId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword]);

  useEffect(() => {
    if (!activeRowId) return;
    if (!pagedInstances.some((instance) => instance.instanceId === activeRowId)) {
      setActiveRowId(null);
    }
  }, [activeRowId, pagedInstances]);

  useEffect(() => {
    if (!hasSelectedInstance || !canWriteService) {
      setOperationDropdownOpen(false);
    }
  }, [hasSelectedInstance, canWriteService]);

  useEffect(() => {
    const categoryFromQuery = searchParams.get("category");
    const serviceFromQuery = searchParams.get("service");

    if (!categoryFromQuery || !serviceFromQuery) {
      setActiveCategoryId(fallbackTarget.categoryId);
      setActiveServiceId(fallbackTarget.serviceId);
      return;
    }

    const matchedCategory = SERVICE_CATEGORIES.find((category) => category.id === categoryFromQuery);
    if (!matchedCategory) {
      setActiveCategoryId(fallbackTarget.categoryId);
      setActiveServiceId(fallbackTarget.serviceId);
      return;
    }

    const matchedService = matchedCategory.services.find((service) => service.id === serviceFromQuery);
    if (!matchedService) {
      setActiveCategoryId(fallbackTarget.categoryId);
      setActiveServiceId(fallbackTarget.serviceId);
      return;
    }

    const canReadRequestedService = hasServicePermission(
      loginUser?.roles,
      matchedCategory.id,
      matchedService.id,
      "read"
    );
    if (!canReadRequestedService) {
      setActiveCategoryId(fallbackTarget.categoryId);
      setActiveServiceId(fallbackTarget.serviceId);
      return;
    }

    setActiveCategoryId(matchedCategory.id);
    setActiveServiceId(matchedService.id);
  }, [searchParams, loginUser?.roles, fallbackTarget.categoryId, fallbackTarget.serviceId]);

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  if (!initialized || isInitializing) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-[1320px] items-center justify-center px-5 md:px-8">
        <p className="text-sm font-medium text-slate-500">인증 상태를 확인 중입니다...</p>
      </main>
    );
  }

  if (!loginUser) {
    return null;
  }

  if (!canReadService) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f3f4f7]">
      <header className="sticky top-0 z-30 border-b border-slate-700 bg-[#111827] text-white">
        <div className="mx-auto flex h-14 w-full max-w-[1840px] items-center justify-between px-8 md:px-12">
          <Link href="/" aria-label="메인으로 이동">
            <BrandLogo size="sm" className="text-white" />
          </Link>

          <div ref={profileWrapperRef} className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-500/80 bg-slate-800/70"
              aria-label="사용자"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-slate-100" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5 19a7 7 0 0 1 14 0" strokeLinecap="round" />
              </svg>
            </button>

            {profileOpen ? (
              <div className="absolute right-0 top-11 w-72 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-[0_20px_40px_-28px_rgba(15,23,42,0.45)]">
                <p className="text-sm font-semibold">{loginUser.displayName}</p>
                <p className="text-xs text-slate-600">{loginUser.email}</p>
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    setProfileOpen(false);
                    router.replace("/auth/sign-in");
                  }}
                  className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                >
                  로그아웃
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main className="grid min-h-[calc(100vh-56px)] w-full" style={{ gridTemplateColumns: sidebarCollapsed ? "72px 1fr" : "248px 1fr" }}>
        <aside className="border-r border-slate-200 bg-[#f8f9fb] p-2">
          <div className="mb-2 flex items-center justify-end">
            <button
              type="button"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100"
              aria-label="사이드바 접기/펼치기"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                {sidebarCollapsed ? <path d="m7 4 6 6-6 6" /> : <path d="m13 4-6 6 6 6" />}
              </svg>
            </button>
          </div>

          <div className="h-[calc(100vh-125px)] overflow-auto rounded-sm border border-slate-200 bg-white px-2 py-1.5">
            {SERVICE_CATEGORIES.map((category) => {
              const isActive = category.id === activeCategory.id;
              const isCollapsed = collapsedCategories[category.id];

              return (
                <section key={category.id} className="mb-1.5 last:mb-0">
                  <div className="group relative flex items-center">
                    {isActive ? <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-[#1f67ff]" /> : null}
                    <button
                      type="button"
                      onClick={() => {
                        const readableService = category.services.find((service) =>
                          hasServicePermission(loginUser?.roles, category.id, service.id, "read")
                        );
                        if (!readableService) {
                          showToast("error", "사용 권한이 없습니다.");
                          return;
                        }
                        setActiveCategoryId(category.id);
                        setActiveServiceId(readableService.id);
                        setCollapsedCategories((prev) => ({ ...prev, [category.id]: false }));
                      }}
                      className={`flex flex-1 items-center gap-2 px-2.5 py-2 text-left text-sm font-semibold transition ${
                        isActive ? "text-[#145fd7]" : "text-slate-700 hover:text-slate-900"
                      }`}
                    >
                      <CategoryIcon id={category.id} />
                      {sidebarCollapsed ? null : category.label}
                    </button>

                    {!sidebarCollapsed ? (
                      <button
                        type="button"
                        onClick={() => toggleCategory(category.id)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label={`${category.label} 하위 메뉴 접기/펼치기`}
                      >
                        <svg
                          viewBox="0 0 20 20"
                          className={`h-4 w-4 transition-transform ${isCollapsed ? "" : "rotate-90"}`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="m7 4 6 6-6 6" />
                        </svg>
                      </button>
                    ) : null}
                  </div>

                  <ul className={`${sidebarCollapsed || isCollapsed ? "hidden" : "mt-0.5 space-y-0.5 pl-7"}`}>
                    {category.services.map((service) => {
                      const isServiceActive = isActive && activeService?.id === service.id;

                      return (
                        <li key={service.id}>
                          <button
                            type="button"
                            onClick={() => {
                              if (!hasServicePermission(loginUser?.roles, category.id, service.id, "read")) {
                                showToast("error", "사용 권한이 없습니다.");
                                return;
                              }
                              setActiveCategoryId(category.id);
                              setActiveServiceId(service.id);
                            }}
                            className={`relative w-full px-2 py-1.5 text-left text-[12px] font-medium transition ${
                              isServiceActive ? "text-[#145fd7]" : "text-slate-500 hover:text-slate-700"
                            }`}
                          >
                            {isServiceActive ? <span className="absolute left-0 top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-full bg-[#1f67ff]" /> : null}
                            {service.name}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        </aside>

        <section className="min-w-0 bg-[#f3f4f7] p-4 md:p-6">
          <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_26px_48px_-34px_rgba(15,23,42,0.48)]">
            <div className="border-b border-slate-100 bg-white px-5 py-4">
              <h1 className="font-[var(--font-sora)] text-[15px] font-semibold tracking-[0.01em] text-slate-900">
                <span className="text-slate-500">{activeCategory.label}</span>
                <span className="px-2 text-slate-300">/</span>
                <span>{activeService?.name ?? "서비스"}</span>
              </h1>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 bg-white px-5 pb-2 pt-6">
              <div className="relative w-[360px]">
                <svg viewBox="0 0 20 20" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="8.5" cy="8.5" r="5" />
                  <path d="m12 12 4 4" />
                </svg>
                <input
                  value={searchKeyword}
                  onChange={(event) => setSearchKeyword(event.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-300/90 bg-white pl-9 pr-3 text-[12px] text-slate-700 placeholder:text-slate-400 transition focus:border-[#18499f] focus:outline-none focus:ring-2 focus:ring-[#18499f]/15"
                  placeholder="이름 또는 태그 검색"
                  aria-label="이름 또는 태그 검색"
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    router.refresh();
                    showToast("success", "목록을 새로고침했습니다.");
                  }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300/90 bg-white text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
                  aria-label="새로고침"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9">
                    <path d="M21 12a9 9 0 1 1-2.64-6.36" strokeLinecap="round" />
                    <path d="M21 3v5h-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {canExecuteService ? (
                  <button
                    type="button"
                    disabled={!hasSelectedInstance}
                    onClick={() => showToast("success", "콘솔 연결을 시작합니다.")}
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300/90 bg-white px-3 text-[12px] font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-300"
                  >
                    콘솔 연결
                  </button>
                ) : null}

                {canWriteService ? (
                  <div ref={operationDropdownRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setOperationDropdownOpen((prev) => !prev)}
                      disabled={!hasSelectedInstance}
                      className="inline-flex h-9 min-w-[190px] items-center justify-between gap-2 rounded-lg border border-slate-300/90 bg-white px-3 text-[12px] font-medium text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-300"
                      aria-label="인스턴스 상태 드롭다운"
                      aria-haspopup="menu"
                      aria-expanded={operationDropdownOpen}
                    >
                      <span>인스턴스 상태</span>
                      <svg viewBox="0 0 20 20" className={`h-4 w-4 text-slate-500 transition ${operationDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="m5 7 5 6 5-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>

                    {operationDropdownOpen && hasSelectedInstance ? (
                      <div className="absolute right-0 top-10 z-20 min-w-[190px] overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-[0_18px_32px_-20px_rgba(15,23,42,0.45)]">
                        {["인스턴스 중지", "인스턴스 재부팅", "인스턴스 삭제"].map((label) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() => {
                              setOperationDropdownOpen(false);
                            }}
                            className="flex h-9 w-full items-center px-3 text-left text-[12px] text-slate-700 transition hover:bg-slate-50"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {canWriteService ? (
                  <button
                    type="button"
                    disabled={!hasSelectedInstance}
                    onClick={() => {
                      showToast("success", `인스턴스 작업 요청: ${activeRowId}`);
                    }}
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300/90 bg-white px-3 text-[12px] font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-300"
                  >
                    인스턴스 작업
                  </button>
                ) : null}

                {canWriteService ? (
                  <button
                    type="button"
                    onClick={() => showToast("success", "인스턴스 생성 화면으로 이동합니다.")}
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-[#123b84] bg-[#123b84] px-3 text-[12px] font-semibold text-white shadow-[0_10px_18px_-14px_rgba(18,59,132,0.9)] transition hover:border-[#0f3170] hover:bg-[#0f3170]"
                  >
                    인스턴스 생성
                  </button>
                ) : null}
              </div>
            </div>

            <div className="overflow-x-auto px-5 pb-1 pt-2">
              <table className="min-w-[1460px] w-full border-separate border-spacing-0 overflow-hidden rounded-lg border border-slate-200/80 bg-white text-[12px] font-[var(--font-body)] text-slate-700">
              <thead className="bg-white text-slate-400">
                <tr>
                  <th className="border-b border-r border-slate-100 px-3 py-2.5 text-left text-[10px] font-semibold tracking-[0.08em]">이름</th>
                  <th className="border-b border-r border-slate-100 px-3 py-2.5 text-left text-[10px] font-semibold tracking-[0.08em]">상태</th>
                  <th className="border-b border-r border-slate-100 px-3 py-2.5 text-left text-[10px] font-semibold tracking-[0.08em]">태그</th>
                  <th className="border-b border-r border-slate-100 px-3 py-2.5 text-left text-[10px] font-semibold tracking-[0.08em]">OS 명</th>
                  <th className="border-b border-r border-slate-100 px-3 py-2.5 text-left text-[10px] font-semibold tracking-[0.08em]">OS 버전</th>
                  <th className="border-b border-r border-slate-100 px-3 py-2.5 text-right text-[10px] font-semibold tracking-[0.08em]">CPU Cores</th>
                  <th className="border-b border-r border-slate-100 px-3 py-2.5 text-right text-[10px] font-semibold tracking-[0.08em]">Memory Size </th>
                  <th className="border-b border-r border-slate-100 px-3 py-2.5 text-right text-[10px] font-semibold tracking-[0.08em]">Storage Size</th>
                  <th className="border-b border-r border-slate-100 px-3 py-2.5 text-left text-[10px] font-semibold tracking-[0.08em]">Public IP</th>
                  <th className="border-b border-r border-slate-100 px-3 py-2.5 text-left text-[10px] font-semibold tracking-[0.08em]">Private IP</th>
                  <th className="border-b border-r border-slate-100 px-3 py-2.5 text-left text-[10px] font-semibold tracking-[0.08em]">VPC 명</th>
                  <th className="border-b border-slate-100 px-3 py-2.5 text-left text-[10px] font-semibold tracking-[0.08em]">인스턴스 ID</th>
                </tr>
              </thead>
              <tbody>
                {pagedInstances.length > 0 ? (
                  pagedInstances.map((instance) => (
                  <tr
                    key={instance.instanceId}
                    onClick={() => setActiveRowId(instance.instanceId)}
                    className={`cursor-pointer transition-colors hover:bg-slate-50 ${
                      activeRowId === instance.instanceId
                        ? "bg-[#f5f8ff] shadow-[inset_2px_0_0_#123b84]"
                        : "bg-white"
                    }`}
                  >
                    <td className="border-b border-r border-slate-100 px-3 py-2.5 text-[12px] font-semibold text-slate-800">{instance.name}</td>
                    <td className="border-b border-r border-slate-100 px-3 py-2.5 text-[12px]">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                          instance.status === "running"
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                            : instance.status === "stopped"
                              ? "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                              : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                        }`}
                      >
                        {instance.status === "running" ? "실행 중" : instance.status === "stopped" ? "중지" : "재부팅 중"}
                      </span>
                    </td>
                    <td className="border-b border-r border-slate-100 px-3 py-2.5 text-[12px]">
                      <div className="flex flex-wrap gap-1">
                        {instance.tags.map((tag) => (
                          <span key={tag} className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="border-b border-r border-slate-100 px-3 py-2.5 text-[12px] text-slate-700">{instance.osName}</td>
                    <td className="border-b border-r border-slate-100 px-3 py-2.5 text-[12px] text-slate-700">{instance.osVersion}</td>
                    <td className="border-b border-r border-slate-100 px-3 py-2.5 text-right text-[12px] text-slate-700">{instance.cpuCores}</td>
                    <td className="border-b border-r border-slate-100 px-3 py-2.5 text-right text-[12px] text-slate-700">{instance.memorySizeGb}</td>
                    <td className="border-b border-r border-slate-100 px-3 py-2.5 text-right text-[12px] text-slate-700">{instance.storageSizeGb}</td>
                    <td className="border-b border-r border-slate-100 px-3 py-2.5 text-[12px] text-slate-700">{instance.publicIp}</td>
                    <td className="border-b border-r border-slate-100 px-3 py-2.5 text-[12px] text-slate-700">{instance.privateIp}</td>
                    <td className="border-b border-r border-slate-100 px-3 py-2.5 text-[12px] text-slate-700">{instance.vpcName}</td>
                    <td className="border-b border-slate-100 px-3 py-2.5 text-[12px] text-slate-700">{instance.instanceId}</td>
                  </tr>
                ))) : (
                  <tr>
                    <td className="h-11 border-b border-slate-100 px-3 py-2 text-center text-[12px] text-slate-500" colSpan={12}>
                      표시할 인스턴스가 없습니다.
                    </td>
                  </tr>
                )}

                {Array.from({ length: emptyRowCount }).map((_, index) => (
                  <tr key={`empty-row-${index}`} className="bg-white">
                    <td className="h-11 border-b border-r border-slate-100 px-3 py-2" />
                    <td className="h-11 border-b border-r border-slate-100 px-3 py-2" />
                    <td className="h-11 border-b border-r border-slate-100 px-3 py-2" />
                    <td className="h-11 border-b border-r border-slate-100 px-3 py-2" />
                    <td className="h-11 border-b border-r border-slate-100 px-3 py-2" />
                    <td className="h-11 border-b border-r border-slate-100 px-3 py-2" />
                    <td className="h-11 border-b border-r border-slate-100 px-3 py-2" />
                    <td className="h-11 border-b border-r border-slate-100 px-3 py-2" />
                    <td className="h-11 border-b border-r border-slate-100 px-3 py-2" />
                    <td className="h-11 border-b border-r border-slate-100 px-3 py-2" />
                    <td className="h-11 border-b border-r border-slate-100 px-3 py-2" />
                    <td className="h-11 border-b border-slate-100 px-3 py-2" />
                  </tr>
                ))}
              </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end bg-white px-5 pb-6 pt-3">
              <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/70 px-2 py-1 text-[12px] text-slate-600">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-400 transition hover:bg-white hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="이전 페이지"
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m12 5-5 5 5 5" />
                  </svg>
                </button>

                {visiblePages.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`inline-flex h-6 min-w-6 items-center justify-center rounded px-1 ${
                      page === currentPage
                        ? "bg-white font-semibold text-[#123b84] shadow-sm"
                        : "text-slate-500 hover:bg-white hover:text-slate-800"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                {totalPages > 2 ? <span className="px-0.5 text-slate-500">...</span> : null}

                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-500 transition hover:bg-white hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="다음 페이지"
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m8 5 5 5-5 5" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
