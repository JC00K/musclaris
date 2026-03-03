/**
 * Color Tokens
 *
 * Central palette for light and dark themes.
 * Every screen references these tokens instead of hardcoded colors.
 */

export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  primary: string;
  primaryText: string;
  danger: string;
  dangerBackground: string;
  dangerText: string;
  border: string;
  shadow: string;
  success: string;
  warning: string;
  overlay: string;
  inputBackground: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;
  buttonSecondary: string;
  buttonSecondaryText: string;
}

export const lightColors: ThemeColors = {
  background: "#f8f9fa",
  surface: "#ffffff",
  text: "#1a1a2e",
  textSecondary: "#495057",
  textTertiary: "#6c757d",
  primary: "#1a1a2e",
  primaryText: "#ffffff",
  danger: "#dc2626",
  dangerBackground: "#fee2e2",
  dangerText: "#dc2626",
  border: "#e9ecef",
  shadow: "#000000",
  success: "#22c55e",
  warning: "#eab308",
  overlay: "rgba(0, 0, 0, 0.5)",
  inputBackground: "#ffffff",
  inputBorder: "#ced4da",
  inputText: "#1a1a2e",
  inputPlaceholder: "#adb5bd",
  buttonSecondary: "#6c757d",
  buttonSecondaryText: "#ffffff",
};

export const darkColors: ThemeColors = {
  background: "#121218",
  surface: "#1e1e2a",
  text: "#e4e4e7",
  textSecondary: "#a1a1aa",
  textTertiary: "#71717a",
  primary: "#6366f1",
  primaryText: "#ffffff",
  danger: "#ef4444",
  dangerBackground: "#2d1515",
  dangerText: "#fca5a5",
  border: "#2e2e3a",
  shadow: "#000000",
  success: "#22c55e",
  warning: "#eab308",
  overlay: "rgba(0, 0, 0, 0.7)",
  inputBackground: "#1e1e2a",
  inputBorder: "#3f3f50",
  inputText: "#e4e4e7",
  inputPlaceholder: "#52525b",
  buttonSecondary: "#3f3f50",
  buttonSecondaryText: "#e4e4e7",
};
