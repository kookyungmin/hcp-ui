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

      if (!token) {
        try {
          const refreshResult = await refreshTokenApi();
          setAccessToken(refreshResult.accessToken);
        } catch {
          set({ loginUser: null, initialized: true, isInitializing: false });
          return;
        }
      }

      const me = await getMeApi();
      set({ loginUser: me, initialized: true, isInitializing: false });
    } catch {
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
