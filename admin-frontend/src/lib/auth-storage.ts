import { type PersistStorage, type StorageValue } from 'zustand/middleware';

const COOKIE_NAME = 'noble-cert-auth';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 ngày

function setCookie(value: string) {
  document.cookie = `${COOKIE_NAME}=1; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  localStorage.setItem(COOKIE_NAME, value);
}

function removeCookie() {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
  localStorage.removeItem(COOKIE_NAME);
}

/**
 * Custom Zustand storage:
 * - Lưu state vào localStorage (đọc ở client)
 * - Sync cookie presence để middleware Edge có thể kiểm tra
 */
export function createAuthStorage<T>(): PersistStorage<T> {
  return {
    getItem: (name): StorageValue<T> | null => {
      if (typeof window === 'undefined') return null;
      const raw = localStorage.getItem(name);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as StorageValue<T>;
      } catch {
        return null;
      }
    },
    setItem: (name, value) => {
      if (typeof window === 'undefined') return;
      const serialized = JSON.stringify(value);
      setCookie(serialized);
      localStorage.setItem(name, serialized);
    },
    removeItem: (name) => {
      if (typeof window === 'undefined') return;
      removeCookie();
      localStorage.removeItem(name);
    },
  };
}
