/**
 * useTheme Hook
 *
 * Connects React Native's system color scheme detection
 * to the theme store. Returns resolved colors and the
 * current preference for use in any component.
 */

import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { useThemeStore } from "../store/themeStore";
import type { ThemePreference, ResolvedTheme } from "../store/themeStore";
import type { ThemeColors } from "../theme/colors";

interface UseThemeReturn {
  colors: ThemeColors;
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (pref: ThemePreference) => void;
}

export function useTheme(): UseThemeReturn {
  const systemColorScheme = useColorScheme();
  const {
    colors,
    preference,
    systemTheme,
    setPreference,
    setSystemTheme,
    loadFromDevice,
  } = useThemeStore();

  /* Sync device system theme changes into the store */
  useEffect(() => {
    const detected: ResolvedTheme =
      systemColorScheme === "dark" ? "dark" : "light";
    if (detected !== systemTheme) {
      setSystemTheme(detected);
    }
  }, [systemColorScheme, systemTheme, setSystemTheme]);

  /* Load saved preference from device on mount */
  useEffect(() => {
    loadFromDevice();
  }, [loadFromDevice]);

  const resolved: ResolvedTheme =
    preference === "system"
      ? systemColorScheme === "dark"
        ? "dark"
        : "light"
      : preference;

  return { colors, preference, resolved, setPreference };
}
