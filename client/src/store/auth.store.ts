import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api.service';

export const useAuthStore = create((set: any) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: async () => {
    const token = await AsyncStorage.getItem('nexus_token');
    if (token) {
      try {
        const res = await api.get('/auth/me');
        set({ user: res.data, token, isAuthenticated: true, isLoading: false });
      } catch {
        await AsyncStorage.removeItem('nexus_token');
        set({ isLoading: false });
      }
    } else { set({ isLoading: false }); }
  },

  login: async (username: string, password: string) => {
    const res = await api.post('/auth/login', { username, password });
    await AsyncStorage.setItem('nexus_token', res.data.accessToken);
    set({ user: res.data.user, token: res.data.accessToken, isAuthenticated: true });
  },

  register: async (username: string, password: string, displayName?: string) => {
    const res = await api.post('/auth/register', { username, password, displayName });
    await AsyncStorage.setItem('nexus_token', res.data.accessToken);
    set({ user: res.data.user, token: res.data.accessToken, isAuthenticated: true });
  },

  logout: async () => {
    await AsyncStorage.removeItem('nexus_token');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
