const ACCESS_TOKEN_KEY = "happycloud_access_token";

let memoryAccessToken: string | null = null;

export function getAccessToken() {
  if (memoryAccessToken) return memoryAccessToken;

  if (typeof window === "undefined") return null;

  const token = window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
  memoryAccessToken = token;
  return token;
}

export function setAccessToken(token: string) {
  memoryAccessToken = token;

  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  }
}

export function clearAccessToken() {
  memoryAccessToken = null;

  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  }
}
