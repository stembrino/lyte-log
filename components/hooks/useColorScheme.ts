import { useThemePreference } from "@/components/theme-preference";

export function useColorScheme() {
  const { theme } = useThemePreference();
  return theme;
}
