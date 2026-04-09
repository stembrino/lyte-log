import type { ColorSchemeName } from "react-native";

export const monoFont = "monospace";

export const retro = {
  brand: "#E95420",
  accent: "#E95420",
  accentPressed: "#C34113",
  terminal: "#31F91E",
  light: {
    bg: "#F7F7F7",
    card: "#FFFFFF",
    text: "#2C2C2C",
    muted: "#6B7280",
    border: "#D1D5DB",
  },
  dark: {
    bg: "#1E1E1E",
    card: "#2D2D2D",
    text: "#EAEAEA",
    muted: "#888888",
    border: "#404040",
  },
} as const;

export function getRetroPalette(colorScheme: ColorSchemeName) {
  const mode = colorScheme === "dark" ? retro.dark : retro.light;

  return {
    page: mode.bg,
    card: mode.card,
    border: mode.border,
    textPrimary: mode.text,
    textSecondary: mode.muted,
    inputBg: mode.card,
    inputBorder: mode.border,
    tag: mode.card,
    tagBorder: mode.border,
    tagText: mode.text,
    accent: retro.brand,
    accentPressed: retro.accentPressed,
    success: retro.terminal,
    listSelected: colorScheme === "dark" ? "#362117" : "#FFF1EA",
    routineBg: mode.card,
  };
}
