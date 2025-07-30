import { z } from 'zod';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const ThemeSchema = z.enum(['light', 'dark', 'system']);
const ViewModeSchema = z.enum(['grid', 'list']);

const SettingsSchema = z.object({
  compactMode: z.boolean().default(true),
  animations: z.boolean().default(true),
  analytics: z.boolean().default(true),
  saveSearchHistory: z.boolean().default(true),
});

export type Theme = z.infer<typeof ThemeSchema>;
export type ViewMode = z.infer<typeof ViewModeSchema>;
export type Settings = z.infer<typeof SettingsSchema>;

const STORAGE_KEYS = {
  SETTINGS: 'toolify-settings',
  FAVORITES: 'toolify-favorites',
  SEARCH_HISTORY: 'toolify-search-history',
  TOOL_HISTORY: 'toolify-tool-history',
  VIEW_MODE: 'toolify-view-mode',
} as const;

const defaultSettings: Settings = {
  compactMode: true,
  animations: true,
  analytics: true,
  saveSearchHistory: true,
};

interface SettingsStore extends Settings {
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  resetSettings: () => void;
  setCompactMode: (enabled: boolean) => void;
  setAnimations: (enabled: boolean) => void;
  setAnalytics: (enabled: boolean) => void;

  favorites: string[];
  addFavorite: (toolId: string) => void;
  removeFavorite: (toolId: string) => void;
  toggleFavorite: (toolId: string) => void;
  isFavorite: (toolId: string) => boolean;

  getStorageStats: () => {
    favorites: number;
    searchHistory: number;
    toolHistory: number;
    totalSize: string;
  };
  clearAllData: () => void;
  exportData: () => void;
}

/**
 * Calculates the total size of localStorage data
 * @returns Formatted size string
 */
const getStorageSize = (): string => {
  if (typeof window === 'undefined') return '0 KB';
  try {
    let total = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return total > 1024 ? `${(total / 1024).toFixed(1)} KB` : `${total} B`;
  } catch {
    return 'Unknown';
  }
};

/**
 * Gets storage statistics for all stored data
 * @returns Object with counts and total size
 */
const getStorageStats = () => {
  if (typeof window === 'undefined') {
    return {
      favorites: 0,
      searchHistory: 0,
      toolHistory: 0,
      totalSize: '0 KB',
    };
  }

  try {
    const favorites = JSON.parse(localStorage.getItem(STORAGE_KEYS.FAVORITES) || '[]');
    const searchHistory = JSON.parse(localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY) || '[]');
    const toolHistory = JSON.parse(localStorage.getItem(STORAGE_KEYS.TOOL_HISTORY) || '[]');

    return {
      favorites: favorites.length,
      searchHistory: searchHistory.length,
      toolHistory: toolHistory.length,
      totalSize: getStorageSize(),
    };
  } catch {
    return {
      favorites: 0,
      searchHistory: 0,
      toolHistory: 0,
      totalSize: '0 KB',
    };
  }
};

/**
 * Retrieves favorites from localStorage
 * @returns Array of favorite tool IDs
 */
const getFavorites = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.FAVORITES) || '[]');
  } catch {
    return [];
  }
};

/**
 * Saves favorites to localStorage
 * @param favorites - Array of favorite tool IDs
 */
const setFavorites = (favorites: string[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
  } catch {
    console.error('Failed to save favorites to localStorage');
  }
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ...defaultSettings,
      favorites: getFavorites(),

      updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => {
        set({ [key]: value });
      },

      resetSettings: () => {
        set(defaultSettings);
      },

      setCompactMode: (enabled: boolean) => {
        set({ compactMode: enabled });
      },

      setAnimations: (enabled: boolean) => {
        set({ animations: enabled });
      },

      setAnalytics: (enabled: boolean) => {
        set({ analytics: enabled });
      },

      addFavorite: (toolId: string) => {
        const { favorites } = get();
        if (!favorites.includes(toolId)) {
          const newFavorites = [...favorites, toolId];
          set({ favorites: newFavorites });
          setFavorites(newFavorites);
        }
      },

      removeFavorite: (toolId: string) => {
        const { favorites } = get();
        const newFavorites = favorites.filter((id: string) => id !== toolId);
        set({ favorites: newFavorites });
        setFavorites(newFavorites);
      },

      toggleFavorite: (toolId: string) => {
        const { favorites } = get();
        if (favorites.includes(toolId)) {
          get().removeFavorite(toolId);
        } else {
          get().addFavorite(toolId);
        }
      },

      isFavorite: (toolId: string) => {
        const { favorites } = get();
        return favorites.includes(toolId);
      },

      getStorageStats,

      clearAllData: () => {
        if (typeof window === 'undefined') return;

        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
          localStorage.removeItem(STORAGE_KEYS.FAVORITES);
          localStorage.removeItem(STORAGE_KEYS.SEARCH_HISTORY);
          localStorage.removeItem(STORAGE_KEYS.TOOL_HISTORY);
          set({ favorites: [] });
        }
      },

      exportData: () => {
        if (typeof window === 'undefined') return;

        try {
          const data = {
            settings: get(),
            favorites: JSON.parse(localStorage.getItem(STORAGE_KEYS.FAVORITES) || '[]'),
            searchHistory: JSON.parse(localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY) || '[]'),
            toolHistory: JSON.parse(localStorage.getItem(STORAGE_KEYS.TOOL_HISTORY) || '[]'),
            exportDate: new Date().toISOString(),
          };

          const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json',
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `toolify-data-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Failed to export data:', error);
        }
      },
    }),
    {
      name: STORAGE_KEYS.SETTINGS,
      storage: createJSONStorage(() => localStorage),
      partialize: state => {
        const {
          updateSetting,
          resetSettings,
          setCompactMode,
          setAnimations,
          setAnalytics,
          addFavorite,
          removeFavorite,
          toggleFavorite,
          isFavorite,
          getStorageStats,
          clearAllData,
          exportData,
          favorites,
          ...settings
        } = state;
        return settings;
      },
      onRehydrateStorage: () => state => {
        if (state) {
          try {
            const validated = SettingsSchema.parse(state);
            Object.assign(state, validated);
            state.favorites = getFavorites();
          } catch (error) {
            console.warn('Invalid settings data, using defaults:', error);
            Object.assign(state, defaultSettings);
            state.favorites = getFavorites();
          }
        }
      },
    },
  ),
);

type ViewModeStore = {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
};

export const useViewModeStore = create<ViewModeStore>()(
  persist(
    set => ({
      viewMode: 'grid',
      setViewMode: (mode: ViewMode) => {
        console.log('🔄 ViewMode changing to:', mode);
        set({ viewMode: mode });
      },
    }),
    {
      name: STORAGE_KEYS.VIEW_MODE,
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => state => {
        if (state) {
          console.log('🔄 ViewMode rehydrated:', state.viewMode);
        }
      },
    },
  ),
);

export const useViewMode = () => useViewModeStore(state => state.viewMode);

export const useCompactMode = () => useSettingsStore(state => state.compactMode);
export const useAnimations = () => useSettingsStore(state => state.animations);
export const useAnalytics = () => useSettingsStore(state => state.analytics);
export const useSaveSearchHistory = () => useSettingsStore(state => state.saveSearchHistory);
export const useFavorites = () => useSettingsStore(state => state.favorites);
