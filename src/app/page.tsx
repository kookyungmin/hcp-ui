"use client";

import { useEffect } from "react";
import { useCounterStore } from "@/shared/stores/counter.store";

export default function HomePage() {
  const { count, increase } = useCounterStore();

  useEffect(() => {
    void import("@/shared/api/client");
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 py-16">
      <h1 className="text-3xl font-bold">HCP UI Starter</h1>
      <p className="text-gray-600">Next.js 14 + React 18 + TypeScript 5 + Tailwind + Zustand + Axios</p>

      <div className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3">
        <span className="text-lg font-medium">Count: {count}</span>
        <button
          type="button"
          onClick={increase}
          className="rounded-md bg-black px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800"
        >
          +1
        </button>
      </div>
    </main>
  );
}
