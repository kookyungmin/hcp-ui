import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pb-8 pt-10 md:pt-14">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-[520px] bg-gradient-to-br from-[#f5fbff] via-[#eef4ff] to-[#f4f7fc]" />
        <div className="absolute left-[-80px] top-[-100px] h-[380px] w-[380px] rounded-full bg-cyan-200/35 blur-3xl" />
        <div className="absolute right-[-40px] top-[-70px] h-[320px] w-[320px] rounded-full bg-blue-200/30 blur-3xl" />
      </div>

      <div className="mx-auto grid w-full max-w-[1320px] gap-9 px-5 md:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div className="space-y-6">
          <p className="inline-flex items-center rounded-full border border-[#8ac0ff] bg-[#eaf3ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#1f67ff]">
            Enterprise Cloud Service
          </p>
          <h1 className="font-sora text-4xl font-semibold leading-tight text-slate-950 md:text-6xl">
            원하는 클라우드 환경을
            <br />
            빠르게 생성하고 운영하세요
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg">
            운영 콘솔에서 VM, DB, VPC, Object Storage 등 핵심 서비스를 통합 관리할 수 있습니다.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/auth/sign-in"
              className="inline-flex h-12 items-center rounded-xl bg-[#1f67ff] px-5 text-sm font-semibold text-white transition hover:bg-[#1457d9]"
            >
              콘솔 로그인
            </Link>
            <Link
              href="#services"
              className="inline-flex h-12 items-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
            >
              서비스 보기
            </Link>
          </div>
        </div>

        <div className="grid gap-3 rounded-3xl border border-slate-200/90 bg-white/90 p-5 shadow-[0_18px_50px_-35px_rgba(2,6,23,0.5)] backdrop-blur">
          <div className="rounded-2xl bg-[#0f62ff] p-4 text-white">
            <p className="text-xs font-medium text-blue-100">Cloud Ready</p>
            <p className="pt-1 font-sora text-2xl font-semibold">7 Core Services</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500">Connected Projects</p>
              <p className="pt-1 font-sora text-2xl font-semibold text-slate-900">143</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500">Security Coverage</p>
              <p className="pt-1 font-sora text-2xl font-semibold text-emerald-600">99.1%</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
