import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const LIGHT: Record<string, string> = {
  '--color-background': '#ffffff',
  '--color-background-secondary': '#f5f6f8',
  '--color-surface': '#ffffff',
  '--color-text': '#101418',
  '--color-text-muted': '#707579',
  '--color-border': '#dfe3e8',
};

interface ChatSettingsState {
  fontSize: number;
  bubbleRadius: number;
  nameColor: string;
  listLines: 2 | 3;
  enterToSend: boolean;
  animations: boolean;
  wallpaper: string | null;
  wallpaperX: number;
  wallpaperZoom: number;
  wallpaperTile: boolean;
  appIcon: string | null;
  lightTheme: boolean;
  set: (p: Partial<ChatSettingsState>) => void;
  apply: () => void;
}

export const useChatSettings = create<ChatSettingsState>()(
  persist(
    (set, get) => ({
      fontSize: 15,
      bubbleRadius: 16,
      nameColor: '#2196f3',
      listLines: 2,
      enterToSend: true,
      animations: true,
      wallpaper: null,
      wallpaperX: 50,
      wallpaperZoom: 100,
      wallpaperTile: false,
      appIcon: null,
      lightTheme: false,
      set: (p) => { set(p); get().apply(); },
      apply: () => {
        const s = get();
        const r = document.documentElement;

        if (s.lightTheme) Object.entries(LIGHT).forEach(([k, v]) => r.style.setProperty(k, v));
        else Object.keys(LIGHT).forEach(k => r.style.removeProperty(k));

        r.style.setProperty('--chat-font-size', s.fontSize + 'px');
        r.style.setProperty('--bubble-radius', s.bubbleRadius + 'px');
        r.style.setProperty('--name-color', s.nameColor);
        r.dataset.anim = s.animations ? 'on' : 'off';
        r.dataset.listlines = String(s.listLines);
        (window as any).__nexusEnterSend = s.enterToSend;

        if (s.wallpaper) {
          r.style.setProperty('--chat-wallpaper', `url("${s.wallpaper}")`);
          // высота ровно по контейнеру (×zoom), ширина свободная — ездит по горизонтали
          r.style.setProperty('--chat-wallpaper-size', `auto ${s.wallpaperZoom}dvh`);
          r.style.setProperty('--chat-wallpaper-pos', `${s.wallpaperX}% center`);
          r.style.setProperty('--chat-wallpaper-repeat', s.wallpaperTile ? 'repeat' : 'no-repeat');
          r.dataset.wallpaper = '1';
        } else {
          r.style.removeProperty('--chat-wallpaper');
          delete r.dataset.wallpaper;
        }

        if (s.appIcon) {
          document.querySelector('link[rel="icon"]')?.setAttribute('href', s.appIcon);
          document.querySelector('link[rel="apple-touch-icon"]')?.setAttribute('href', s.appIcon);
        }
      },
    }),
    { name: 'nexus-chat-settings' }
  )
);
