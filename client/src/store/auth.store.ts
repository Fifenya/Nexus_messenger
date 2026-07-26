import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api.service';
import { socketService } from '../services/socket.service';

export interface NexusUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
}

interface AuthState {
  user: NexusUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialize: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: async () => {
    try {
      const [token, userJson] = await Promise.all([
        AsyncStorage.getItem('nexus_token'),
        AsyncStorage.getItem('nexus_user'),
      ]);
      if (token && userJson) {
        set({ token, user: JSON.parse(userJson), isAuthenticated: true });
        socketService.connect(token);
      }
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password });
    await AsyncStorage.setItem('nexus_token', data.accessToken);
    await AsyncStorage.setItem('nexus_user', JSON.stringify(data.user));
    set({ token: data.accessToken, user: data.user, isAuthenticated: true });
    socketService.connect(data.accessToken);
  },

  register: async (username, password, displayName) => {
    const { data } = await api.post('/auth/register', { username, password, displayName });
    await AsyncStorage.setItem('nexus_token', data.accessToken);
    await AsyncStorage.setItem('nexus_user', JSON.stringify(data.user));
    set({ token: data.accessToken, user: data.user, isAuthenticated: true });
    socketService.connect(data.accessToken);
  },

  logout: async () => {
    socketService.disconnect();
    await AsyncStorage.multiRemove(['nexus_token', 'nexus_user']);
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
