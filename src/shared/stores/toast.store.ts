import { create } from "zustand";

type ToastType = "success" | "error";

type ToastItem = {
  id: string;
  type: ToastType;
  message: string;
};

type ToastStore = {
  toasts: ToastItem[];
  showToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
};

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  showToast: (type, message, duration = 3000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    set((state) => ({
      toasts: [...state.toasts, { id, type, message }]
    }));

    setTimeout(() => {
      get().removeToast(id);
    }, duration);
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id)
    }));
  }
}));
