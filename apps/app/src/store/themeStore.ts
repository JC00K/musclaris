/**
 * Theme Store
 *
 * Manages theme preference with dual persistence:
 * - Device storage (AsyncStorage/localStorage) for instant load
 * - Supabase user_profiles for cross-device sync
 */

import { create } from "zustand";
import { Platform } from "react-native";
import { lightColors, darkColors } from "../theme/colors";
import type { ThemeColors } from "../theme/colors";

export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

interface ThemeState {
  preference: ThemePreference;
  systemTheme: ResolvedTheme;
  colors: ThemeColors;
  setPreference: (pref: ThemePreference) => void;
  setSystemTheme: (theme: ResolvedTheme) => void;
  loadFromDevice: () => Promise<void>;
}

const STORAGE_KEY = "myonites_theme_preference";

/* Device storage helpers — localStorage on web, AsyncStorage on native */
async function saveToDevice(pref: ThemePreference): Promise<void> {
  try {
    if (Platform.OS === "web") {
      localStorage.setItem(STORAGE_KEY, pref);
    } else {
      const AsyncStorage =
        await import("@react-native-async-storage/async-storage").then(
          (m) => m.default,
        );
      await AsyncStorage.setItem(STORAGE_KEY, pref);
    }
  } catch {
    /* Storage unavailable — preference won't persist but app still works */
  }
}

async function readFromDevice(): Promise<ThemePreference | null> {
  try {
    if (Platform.OS === "web") {
      return localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
    } else {
      const AsyncStorage =
        await import("@react-native-async-storage/async-storage").then(
          (m) => m.default,
        );
      return (await AsyncStorage.getItem(
        STORAGE_KEY,
      )) as ThemePreference | null;
    }
  } catch {
    return null;
  }
}

function resolveColors(
  preference: ThemePreference,
  systemTheme: ResolvedTheme,
): ThemeColors {
  const resolved = preference === "system" ? systemTheme : preference;
  return resolved === "dark" ? darkColors : lightColors;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  preference: "system",
  systemTheme: "light",
  colors: lightColors,

  setPreference: (pref: ThemePreference) => {
    const { systemTheme } = get();
    set({
      preference: pref,
      colors: resolveColors(pref, systemTheme),
    });
    saveToDevice(pref);
  },

  setSystemTheme: (theme: ResolvedTheme) => {
    const { preference } = get();
    set({
      systemTheme: theme,
      colors: resolveColors(preference, theme),
    });
  },

  loadFromDevice: async () => {
    const saved = await readFromDevice();
    if (saved) {
      const { systemTheme } = get();
      set({
        preference: saved,
        colors: resolveColors(saved, systemTheme),
      });
    }
  },
}));
