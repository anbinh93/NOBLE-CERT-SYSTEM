import { type PersistStorage, type StorageValue } from "zustand/middleware";

const COOKIE_NAME = "noble-cert-auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 ngày

function setCookie() {
  document.cookie = `${COOKIE_NAME}=1; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

function removeCookie() {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}

/**
 * Custom Zustand storage:
 * - Lưu state vào localStorage (đọc ở client)
 * - Sync cookie presence để middleware Edge có thể kiểm tra
 * - Khi logout (isAuthenticated=false) → xoá cookie để middleware redirect về login
 */
export function createAuthStorage<T>(): PersistStorage<T> {
  return {
    getItem: (name): StorageValue<T> | null => {
      if (typeof window === "undefined") return null;
      const raw = localStorage.getItem(name);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as StorageValue<T>;
      } catch {
        return null;
      }
    },
    setItem: (name, value) => {
      if (typeof window === "undefined") return;
      const serialized = JSON.stringify(value);
      localStorage.setItem(name, serialized);

      // Chỉ set cookie khi user đã authenticated (có accessToken)
      const state = value?.state as any;
      if (state?.isAuthenticated && state?.accessToken) {
        setCookie();
      } else {
        removeCookie();
      }
    },
    removeItem: (name) => {
      if (typeof window === "undefined") return;
      removeCookie();
      localStorage.removeItem(name);
    },
  };
}
