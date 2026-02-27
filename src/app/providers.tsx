"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/shared/stores/auth.store";
import { Toaster } from "@/shared/ui/toaster";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    void initializeAuth();
  }, [initializeAuth]);

  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
