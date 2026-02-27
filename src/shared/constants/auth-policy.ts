export const AUTH_CHECK_SKIP_PATHS = [
  "/users/v1/auth/login",
  "/users/v1/auth/token/refresh"
] as const;

export const TOAST_SILENT_PATHS = [
  "/users/v1/auth/me",
  "/users/v1/auth/token/refresh"
] as const;

export const RETRY_SKIP_PATHS = [
  "/users/v1/auth/login",
  "/users/v1/auth/token/refresh",
  "/users/v1/auth/me"
] as const;

export function includesPath(path: string, patterns: readonly string[]) {
  return patterns.some((pattern) => path.includes(pattern));
}
