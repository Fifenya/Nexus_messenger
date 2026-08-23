import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type StatusIconSet = 'checks' | 'dots' | 'arrows' | 'letters';

interface ThemeState {
  theme: 'light' | 'dark' | 'amoled';
  wallpaper: string;
  wallpaperUrl: string;
  statusIcons: StatusIconSet;
  favicon: string;
  setTheme: (t: 'light' | 'dark' | 'amoled') => void;
  setWallpaper: (id: string, url: string) => void;
  setStatusIcons: (s: StatusIconSet) => void;
  setFavicon: (url: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',
      wallpaper: 'default',
      wallpaperUrl: '',
      statusIcons: 'checks',
      favicon: '',
      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        set({ theme });
      },
      setWallpaper: (wallpaper, wallpaperUrl) => set({ wallpaper, wallpaperUrl }),
      setStatusIcons: (statusIcons) => set({ statusIcons }),
      setFavicon: (favicon) => {
        const link = (document.querySelector("link[rel*='icon']") as HTMLLinkElement) || document.createElement('link');
        link.type = 'image/png';
        link.rel = 'shortcut icon';
        link.href = favicon;
        document.head.appendChild(link);
        set({ favicon });
      },
    }),
    { name: 'nexus-theme' }
  )
);
