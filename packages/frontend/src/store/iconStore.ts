import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Тот же набор id, что лежит в packages/frontend/public/icons/
export const WEB_ICONS = [
  { id: 'classic', name: 'Nexus Classic' },
  { id: 'crimson', name: 'Nexus Crimson' },
  { id: 'neon', name: 'Nexus Neon' },
  { id: 'light', name: 'Nexus Light' },
  { id: 'bubble', name: 'Nexus Bubble' },
  { id: 'line', name: 'Nexus Line' },
  { id: 'emboss', name: 'Nexus Emboss' },
];

function applyFavicon(id: string) {
  const link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
  if (link) link.href = `/icons/${id}-192.png`;
}

interface WebIconState {
  currentIcon: string;
  setIcon: (id: string) => void;
}

export const useWebIconStore = create<WebIconState>()(
  persist(
    (set) => ({
      currentIcon: 'classic',
      setIcon: (id) => {
        applyFavicon(id);
        set({ currentIcon: id });
      },
    }),
    {
      name: 'nexus-web-icon',
      onRehydrateStorage: () => (state) => {
        if (state) applyFavicon(state.currentIcon);
      },
    },
  ),
);
