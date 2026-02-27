import { apiClient } from "@/shared/api/client";
import type { ApiEnvelope } from "@/shared/types/api";
import type { LoginResponseBody, LoginUser } from "@/shared/types/auth";

export async function loginApi(email: string, password: string) {
  const response = await apiClient.post<ApiEnvelope<LoginResponseBody>>("/users/v1/auth/login", {
    email,
    password
  });

  return response.data.body;
}

export async function getMeApi() {
  const response = await apiClient.get<ApiEnvelope<LoginUser>>("/users/v1/auth/me");
  return response.data.body;
}

export async function refreshTokenApi() {
  const response = await apiClient.post<ApiEnvelope<LoginResponseBody>>("/users/v1/auth/token/refresh", {});
  return response.data.body;
}

export async function logoutApi() {
  await apiClient.post("/users/v1/auth/logout", {});
}
