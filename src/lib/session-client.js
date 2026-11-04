const TOKEN_KEY = "lab.token";
const ROLE_KEY = "lab.role";

export function getToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(TOKEN_KEY) || "";
}

export function getStoredRole() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(ROLE_KEY) || "";
}

export function saveSession(token, role) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(ROLE_KEY, role);
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(ROLE_KEY);
}