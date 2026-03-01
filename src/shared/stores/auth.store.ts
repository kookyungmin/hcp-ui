import { create } from "zustand";
import { getMeApi, loginApi, logoutApi, refreshTokenApi } from "@/shared/api/auth.api";
import { clearAccessToken, getAccessToken, setAccessToken } from "@/shared/lib/access-token";
import type { LoginUser } from "@/shared/types/auth";
import { useToastStore } from "@/shared/stores/toast.store";

type AuthStore = {
  loginUser: LoginUser | null;
  isInitializing: boolean;
  isLoggingIn: boolean;
  initialized: boolean;
  initializeAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  loginUser: null,
  isInitializing: false,
  isLoggingIn: false,
  initialized: false,

  initializeAuth: async () => {
    const current = get();
    if (current.initialized || current.isInitializing) {
      return;
    }

    set({ isInitializing: true });

    try {
      const token = getAccessToken();

      // 1) accessToken이 없으면 refresh로 먼저 복구 시도
      if (!token) {
        try {
          const refreshResult = await refreshTokenApi();
          setAccessToken(refreshResult.accessToken);
        } catch {
          clearAccessToken();
          set({ loginUser: null, initialized: true, isInitializing: false });
          return;
        }
      }

      // 2) /me 호출
      try {
        const me = await getMeApi();
        set({ loginUser: me, initialized: true, isInitializing: false });
        return;
      } catch {
        // 3) 토큰 만료 가능성: refresh 후 /me 재시도
        try {
          const refreshResult = await refreshTokenApi();
          setAccessToken(refreshResult.accessToken);
          const me = await getMeApi();
          set({ loginUser: me, initialized: true, isInitializing: false });
          return;
        } catch {
          clearAccessToken();
          set({ loginUser: null, initialized: true, isInitializing: false });
          return;
        }
      }
    } catch {
      clearAccessToken();
      set({ loginUser: null, initialized: true, isInitializing: false });
    }
  },

  login: async (email, password) => {
    set({ isLoggingIn: true });

    try {
      const loginResult = await loginApi(email, password);
      setAccessToken(loginResult.accessToken);
      const me = await getMeApi();

      set({ loginUser: me, isLoggingIn: false });
      useToastStore.getState().showToast("success", "로그인에 성공했습니다.");
      return true;
    } catch {
      set({ isLoggingIn: false });
      return false;
    }
  },

  logout: async () => {
    try {
      await logoutApi();
    } finally {
      clearAccessToken();
      set({ loginUser: null });
    }
  },

  clearAuth: () => {
    clearAccessToken();
    set({ loginUser: null });
  }
}));
