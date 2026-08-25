import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NotifyState {
  browser: boolean;
  sound: boolean;
  preview: boolean;
  autodownload: boolean;
  set: (p: Partial<NotifyState>) => void;
}

export const useNotifySettings = create<NotifyState>()(
  persist(
    (set) => ({
      browser: false,
      sound: true,
      preview: true,
      autodownload: true,
      set: (p) => set(p),
    }),
    { name: 'nexus-notify-settings' }
  )
);
