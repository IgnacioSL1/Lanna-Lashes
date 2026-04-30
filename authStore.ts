/**
 * Auth store — manages user session, JWT tokens, and profile
 * Works with your custom backend API
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiPost, apiGet } from '../services/api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  memberSince: string;
  enrolledCourses: string[];
  completedCourses: string[];
  isPro: boolean;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      signIn: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await apiPost('/auth/signin', { email, password });
          set({ user, token, isLoading: false });
        } catch (e: any) {
          set({ error: e.message, isLoading: false });
          throw e;
        }
      },

      signUp: async (email, password, firstName, lastName) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await apiPost('/auth/signup', {
            email, password, firstName, lastName,
          });
          set({ user, token, isLoading: false });
        } catch (e: any) {
          set({ error: e.message, isLoading: false });
          throw e;
        }
      },

      signOut: async () => {
        set({ user: null, token: null });
        await AsyncStorage.removeItem('lanna-auth');
      },

      refreshUser: async () => {
        try {
          const user = await apiGet('/auth/me');
          set({ user });
        } catch {
          set({ user: null, token: null });
        }
      },

      clearError: () => set({ error: null }),

      isAuthenticated: () => !!get().token && !!get().user,
    }),
    {
      name: 'lanna-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
