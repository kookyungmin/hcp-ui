import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_HOST } from "@/shared/constants/api";
import {
  AUTH_CHECK_SKIP_PATHS,
  RETRY_SKIP_PATHS,
  TOAST_SILENT_PATHS,
  includesPath
} from "@/shared/constants/auth-policy";
import { clearAccessToken, getAccessToken, setAccessToken } from "@/shared/lib/access-token";
import type { ApiEnvelope, ApiErrorBody } from "@/shared/types/api";
import type { LoginResponseBody } from "@/shared/types/auth";
import { useToastStore } from "@/shared/stores/toast.store";

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export const apiClient = axios.create({
  baseURL: API_HOST,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

apiClient.interceptors.request.use((config) => {
  const path = config.url ?? "";
  const token = getAccessToken();

  if (token && !includesPath(path, AUTH_CHECK_SKIP_PATHS)) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config as RetryConfig | undefined;
    const status = error.response?.status;
    const path = original?.url ?? "";
    const isToastSilentPath = includesPath(path, TOAST_SILENT_PATHS);

    if (
      status === 401 &&
      original &&
      !original._retry &&
      !includesPath(path, RETRY_SKIP_PATHS)
    ) {
      original._retry = true;

      try {
        const refreshResponse = await axios.post<ApiEnvelope<LoginResponseBody>>(
          `${API_HOST}/users/v1/auth/token/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = refreshResponse.data.body.accessToken;
        setAccessToken(newToken);

        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      } catch (refreshError) {
        clearAccessToken();
        const refreshAxiosError = refreshError as AxiosError<ApiErrorBody>;
        if (isToastSilentPath) {
          return Promise.reject(refreshError);
        }

        if (!refreshAxiosError.response) {
          useToastStore.getState().showToast("error", "네트워크 에러가 발생했습니다. 잠시 후 다시 시도해 주세요.");
          return Promise.reject(refreshError);
        }

        const refreshMessage = refreshAxiosError.response?.data?.message;
        if (refreshMessage) {
          useToastStore.getState().showToast("error", refreshMessage);
        }
        return Promise.reject(refreshError);
      }
    }

    if (isToastSilentPath) {
      return Promise.reject(error);
    }

    if (!error.response) {
      useToastStore.getState().showToast("error", "네트워크 에러가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      return Promise.reject(error);
    }

    const message = error.response?.data?.message;
    if (message) {
      useToastStore.getState().showToast("error", message);
    }

    return Promise.reject(error);
  }
);
