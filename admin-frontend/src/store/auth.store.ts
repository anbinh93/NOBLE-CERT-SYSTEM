import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type AuthUser, type Role } from '@/types/auth';
import { createAuthStorage } from '@/lib/auth-storage';

export type { Role, AuthUser as User };

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'noble-cert-auth',
      storage: createAuthStorage<AuthState>(),
    }
  )
);
