import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ThemeColors {
  background: string;
  backgroundSecondary: string;
  surface: string;
  accent: string;
  accentHover: string;
  text: string;
  textMuted: string;
  border: string;
  error: string;
  success: string;
}

export interface Theme {
  name: string;
  colors: ThemeColors;
}

// Стандартная палитра Nexus: черный + красный
export const NEXUS_DARK_THEME: Theme = {
  name: 'Nexus Dark',
  colors: {
    background: '#0a0a0a',
    backgroundSecondary: '#1a1a1a',
    surface: '#252525',
    accent: '#dc2626',
    accentHover: '#ef4444',
    text: '#ffffff',
    textMuted: '#a1a1aa',
    border: '#2e2e2e',
    error: '#dc2626',
    success: '#10b981',
  },
};

export const NEXUS_CYBERPUNK_THEME: Theme = {
  name: 'Nexus Cyberpunk',
  colors: {
    background: '#000000',
    backgroundSecondary: '#18001f',
    surface: '#2a0033',
    accent: '#ff003c',
    accentHover: '#ff2e63',
    text: '#ffffff',
    textMuted: '#ff9ebb',
    border: '#ff003c',
    error: '#ff003c',
    success: '#00ff9f',
  },
};

interface ThemeState {
  currentTheme: Theme;
  setTheme: (theme: Theme) => void;
  setCustomColors: (colors: Partial<ThemeColors>) => void;
  resetTheme: () => void;
}

// Применяем CSS переменные к DOM
function applyThemeToDOM(theme: Theme) {
  const root = document.documentElement;
  Object.entries(theme.colors).forEach(([key, value]) => {
    const cssVar = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    root.style.setProperty(cssVar, value);
  });
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      currentTheme: NEXUS_DARK_THEME,
      
      setTheme: (theme) => {
        applyThemeToDOM(theme);
        set({ currentTheme: theme });
      },
      
      setCustomColors: (colors) => set((state) => {
        const newTheme: Theme = {
          name: 'Custom',
          colors: { ...state.currentTheme.colors, ...colors },
        };
        applyThemeToDOM(newTheme);
        return { currentTheme: newTheme };
      }),
      
      resetTheme: () => {
        applyThemeToDOM(NEXUS_DARK_THEME);
        set({ currentTheme: NEXUS_DARK_THEME });
      },
    }),
    { 
      name: 'nexus-theme',
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            applyThemeToDOM(state.currentTheme);
          }
        };
      }
    }
  )
);
