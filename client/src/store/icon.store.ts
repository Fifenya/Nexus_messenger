import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NativeModules, Platform } from 'react-native';
import { AVAILABLE_ICONS, DEFAULT_ICON } from '../config/icons.generated';

interface IconState {
  currentIcon: string;
  setIcon: (id: string) => Promise<void>;
  syncFromSystem: () => Promise<void>;
}

const ALL_IDS = AVAILABLE_ICONS.map((i) => i.id);

export const useIconStore = create<IconState>()(
  persist(
    (set) => ({
      currentIcon: DEFAULT_ICON,

      setIcon: async (id: string) => {
        if (Platform.OS === 'android' && NativeModules.IconSwitcher) {
          await NativeModules.IconSwitcher.setAppIcon(id, ALL_IDS);
        }
        set({ currentIcon: id });
      },

      syncFromSystem: async () => {
        if (Platform.OS === 'android' && NativeModules.IconSwitcher) {
          const current = await NativeModules.IconSwitcher.getCurrentIcon(ALL_IDS);
          set({ currentIcon: current });
        }
      },
    }),
    { name: 'nexus-icon' },
  ),
);
