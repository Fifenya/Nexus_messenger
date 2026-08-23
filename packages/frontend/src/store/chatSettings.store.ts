import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ChatSettingsState {
  fontSize: number;
  bubbleRadius: number;
  nameColor: string;
  listLines: 2 | 3;
  enterToSend: boolean;
  animations: boolean;
  wallpaper: string | null;
  appIcon: string | null;
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
      appIcon: null,
      set: (p) => { set(p); get().apply(); },
      apply: () => {
        const s = get();
        const r = document.documentElement;
        r.style.setProperty('--chat-font-size', s.fontSize + 'px');
        r.style.setProperty('--bubble-radius', s.bubbleRadius + 'px');
        r.style.setProperty('--name-color', s.nameColor);
        r.dataset.anim = s.animations ? 'on' : 'off';
        r.dataset.listlines = String(s.listLines);
        (window as any).__nexusEnterSend = s.enterToSend;

        if (s.wallpaper) {
          r.style.setProperty('--chat-wallpaper', `url("${s.wallpaper}")`);
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
