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

      initialize: () => {
        const { token } = get();
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          // Проверяем валидность токена
          api.get('/auth/me')
            .then((res) => {
              set({ user: res.data, isAuthenticated: true, isLoading: false });
            })
            .catch(() => {
              set({ user: null, token: null, isAuthenticated: false, isLoading: false });
              delete api.defaults.headers.common['Authorization'];
            });
        } else {
          set({ isLoading: false });
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
