import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Динамический импорт, чтобы избежать циклической зависимости инициализации
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const { useAuthStore } = await import('../store/auth.store');
        useAuthStore.getState().logout();
      } catch (e) {
        console.error('Failed to logout on 401', e);
      }
    }
    return Promise.reject(error);
  },
);
