import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Theme = "dark" | "light";

const THEME_STORAGE_KEY = "workzen_theme";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getInitialTheme(): Theme {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  return storedTheme === "light" || storedTheme === "dark" ? storedTheme : "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, updateTheme] = useState<Theme>(getInitialTheme);

  const setTheme = useCallback((nextTheme: Theme) => {
    updateTheme(nextTheme);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.add("theme-transition");
    localStorage.setItem(THEME_STORAGE_KEY, theme);

    const themeColor = document.querySelector('meta[name="theme-color"]');
    themeColor?.setAttribute("content", theme === "light" ? "#f4f6f1" : "#0a0b0a");

    const timeout = window.setTimeout(() => root.classList.remove("theme-transition"), 240);
    return () => window.clearTimeout(timeout);
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme precisa ser usado dentro de um ThemeProvider");
  }
  return context;
}
