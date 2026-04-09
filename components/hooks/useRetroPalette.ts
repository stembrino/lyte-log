import { useColorScheme } from "./useColorScheme";
import { getRetroPalette } from "@/constants/retroTheme";

export function useRetroPalette() {
  const colorScheme = useColorScheme();
  return getRetroPalette(colorScheme);
}
