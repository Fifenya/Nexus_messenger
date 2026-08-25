import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../utils/api';

interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
  initialize: () => void;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      initialize: async () => {
        console.log('[auth] initialize start');
        const { token } = get();
        
        // Глобальная страховка: через 6 секунд форсируем загрузку
        const forceTimer = setTimeout(() => {
          console.warn('[auth] force timeout 6s');
          set({ isLoading: false });
        }, 6000);
        
        if (!token) {
          clearTimeout(forceTimer);
          console.log('[auth] no token, skip');
          set({ isLoading: false });
          return;
        }
        
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          const res = await Promise.race([
            api.get('/auth/me'),
            new Promise<never>((_, rej) => setTimeout(() => rej(new Error('me timeout')), 5000)),
          ]);
          clearTimeout(forceTimer);
          console.log('[auth] me ok:', res.data?.username);
          set({ user: res.data, isAuthenticated: true, isLoading: false });
        } catch (e) {
          clearTimeout(forceTimer);
          console.warn('[auth] me failed:', (e as Error).message);
          set({ user: null, token: null, isAuthenticated: false, isLoading: false });
          delete api.defaults.headers.common['Authorization'];
        }
      },

      login: async (username: string, password: string) => {
        const res = await api.post('/auth/login', { username, password });
        const { accessToken, user } = res.data;
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        set({ user, token: accessToken, isAuthenticated: true });
      },

      register: async (username: string, password: string, displayName?: string) => {
        const res = await api.post('/auth/register', { username, password, displayName });
        const { accessToken, user } = res.data;
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        set({ user, token: accessToken, isAuthenticated: true });
      },

      logout: () => {
        delete api.defaults.headers.common['Authorization'];
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateUser: (data: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...data } });
        }
      },
    }),
    {
      name: 'nexus-auth',
      partialize: (state) => ({ token: state.token }),
    },
  ),
);
