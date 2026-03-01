"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cloudServices } from "@/features/landing/model/cloud-modules";
import { cn } from "@/shared/lib/cn";
import { hasRolePermission, PERMISSIONS } from "@/shared/lib/permission";
import { useAuthStore } from "@/shared/stores/auth.store";
import { useToastStore } from "@/shared/stores/toast.store";

function hexToRgba(hex: string, alpha: number) {
  const safeHex = hex.replace("#", "");
  const fullHex = safeHex.length === 3 ? safeHex.split("").map((ch) => ch + ch).join("") : safeHex;
  const bigint = Number.parseInt(fullHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function ServiceGrid() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginUser = useAuthStore((state) => state.loginUser);
  const showToast = useToastStore((state) => state.showToast);
  const initialId = searchParams.get("service");

  const validInitialId = useMemo(
    () => (cloudServices.some((item) => item.id === initialId) ? initialId : cloudServices[0].id),
    [initialId]
  );

  const [activeId, setActiveId] = useState(validInitialId);
  useEffect(() => {
    setActiveId(validInitialId);
  }, [validInitialId]);

  const activeService = cloudServices.find((item) => item.id === activeId) ?? cloudServices[0];
  const ActiveIcon = activeService.icon;
  const canReadServerInstance = hasRolePermission(loginUser?.roles, PERMISSIONS.SERVER_INSTANCE_READ);
  const onUnsupportedClick = () => {
    showToast("error", "권한이 없습니다.");
  };

  const onGoConsole = () => {
    const canEnterConsole = activeService.id === "server" && canReadServerInstance;
    if (!canEnterConsole) {
      onUnsupportedClick();
      return;
    }

    router.push("/console?category=compute&service=server");
  };

  return (
    <section className="relative py-10 md:py-12" id="services">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[#f3f5f8] via-[#eef1f6] to-[#f7f8fb]" />
      <div className="mx-auto w-full max-w-[1320px] px-5 md:px-8">
        <div className="rounded-[28px] border border-slate-200 bg-[#eef1f5] p-6 md:p-8">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-sora text-3xl font-semibold text-slate-950">주요 클라우드 서비스를 사용해보세요</h2>
            <a
              href="#services"
              className="inline-flex h-11 items-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              서비스 전체 보기
            </a>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {cloudServices.map((service) => {
              const isActive = service.id === activeId;
              const Icon = service.icon;
              const activeShadow = `0 14px 28px -20px ${hexToRgba(service.accent, 0.85)}`;

              return (
                <button key={service.id} type="button" onClick={() => setActiveId(service.id)} className="group text-center">
                  <div
                    className={cn("mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border bg-white transition", isActive ? "" : "border-slate-300 hover:border-slate-400")}
                    style={
                      isActive
                        ? {
                            borderColor: service.accent,
                            boxShadow: activeShadow
                          }
                        : undefined
                    }
                  >
                    <Icon className={cn("h-8 w-8 transition", isActive ? "scale-105" : "")} />
                  </div>
                  <p className={cn("pt-3 text-base font-semibold", isActive ? "" : "text-slate-800")} style={isActive ? { color: service.accent } : undefined}>
                    {service.name}
                  </p>
                  <div className={cn("mx-auto mt-2 h-1 w-14 rounded-full transition", isActive ? "" : "bg-transparent")} style={isActive ? { backgroundColor: service.accent } : undefined} />
                </button>
              );
            })}
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[0.78fr_1.22fr]">
            <article
              className="relative overflow-hidden rounded-3xl p-7 text-white"
              style={{
                background: `linear-gradient(135deg, ${activeService.deep} 0%, ${activeService.accent} 100%)`
              }}
            >
              <div className="absolute bottom-[-60px] left-[-20px] h-44 w-44 rounded-full bg-white/25 blur-2xl" />
              <div className="relative">
                <p className="text-sm font-medium text-white/85">Selected Service</p>
                <div className="mt-4 inline-flex rounded-2xl bg-white p-3 shadow-sm">
                  <ActiveIcon className="h-10 w-10" />
                </div>
                <h3 className="mt-5 font-sora text-3xl font-semibold">{activeService.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/90">{activeService.summary}</p>
              </div>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_14px_35px_-28px_rgba(2,6,23,0.4)]">
              <div className="rounded-2xl bg-white p-5">
                <p className="text-lg font-semibold text-slate-900">주요 기능</p>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {activeService.highlights.map((item) => (
                    <li key={item} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700">
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex flex-wrap gap-2">
                  {loginUser ? (
                    <button
                      type="button"
                      onClick={onGoConsole}
                      className="inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold text-white transition"
                      style={{ backgroundColor: activeService.accent }}
                    >
                      콘솔에서 시작
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={onUnsupportedClick}
                    className="inline-flex h-10 items-center rounded-xl border bg-white px-4 text-sm font-semibold transition hover:bg-slate-100"
                    style={{ borderColor: hexToRgba(activeService.accent, 0.35), color: activeService.deep }}
                  >
                    상세 보기
                  </button>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
