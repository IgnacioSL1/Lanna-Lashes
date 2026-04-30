// ── Auth store ────────────────────────────────────────────────────────────────
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiPost, apiGet } from '@/services/api';

export interface User {
  id: string; email: string; firstName: string; lastName: string;
  avatar: string | null; isPro: boolean;
}

interface AuthStore {
  user: User | null; token: string | null;
  isLoading: boolean; error: string | null;
  signIn:  (email: string, password: string) => Promise<void>;
  signUp:  (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signOut: () => void;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null, token: null, isLoading: false, error: null,
      signIn: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await apiPost<any>('/api/auth/signin', { email, password });
          localStorage.setItem('ll_token', token);
          set({ user, token, isLoading: false });
        } catch (e: any) { set({ error: e.message, isLoading: false }); throw e; }
      },
      signUp: async (email, password, firstName, lastName) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await apiPost<any>('/api/auth/signup', { email, password, firstName, lastName });
          localStorage.setItem('ll_token', token);
          set({ user, token, isLoading: false });
        } catch (e: any) { set({ error: e.message, isLoading: false }); throw e; }
      },
      signOut: () => {
        localStorage.removeItem('ll_token');
        set({ user: null, token: null });
      },
      refreshUser: async () => {
        try { const user = await apiGet<User>('/api/auth/me'); set({ user }); }
        catch { set({ user: null, token: null }); }
      },
      clearError: () => set({ error: null }),
      isAuthenticated: () => !!get().token && !!get().user,
    }),
    { name: 'lanna-auth', partialize: s => ({ token: s.token, user: s.user }) }
  )
);
