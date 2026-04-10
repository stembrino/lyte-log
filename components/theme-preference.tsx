import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PropsWithChildren } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type AppTheme = "light" | "dark";

type ThemePreferenceContextValue = {
  theme: AppTheme;
  setTheme: (nextTheme: AppTheme) => void;
  toggleTheme: () => void;
};

const ThemePreferenceContext = createContext<ThemePreferenceContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = "@lyte-log/settings/theme";

export function ThemePreferenceProvider({ children }: PropsWithChildren) {
  const [theme, setTheme] = useState<AppTheme>("dark");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved === "dark" || saved === "light") {
          setTheme(saved);
        }
      } catch {
        // Keep default when read fails.
      } finally {
        if (mounted) {
          setHydrated(true);
        }
      }
    };

    loadTheme();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    AsyncStorage.setItem(THEME_STORAGE_KEY, theme).catch(() => {
      // Ignore storage write errors.
    });
  }, [theme, hydrated]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme((current) => (current === "dark" ? "light" : "dark")),
    }),
    [theme],
  );

  return (
    <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>
  );
}

export function useThemePreference() {
  const context = useContext(ThemePreferenceContext);

  if (!context) {
    return {
      theme: "dark" as AppTheme,
      setTheme: () => {},
      toggleTheme: () => {},
    };
  }

  return context;
}
