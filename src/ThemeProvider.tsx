import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark';

const THEME_KEY = 'openly_theme';
const SYSTEM_THEME = '(prefers-color-scheme: dark)';
const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void } | null>(null);

function savedTheme(): Theme | null {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === 'light' || saved === 'dark' ? saved : null;
  } catch {
    return null;
  }
}

function systemTheme(): Theme {
  return typeof window !== 'undefined' && window.matchMedia?.(SYSTEM_THEME).matches ? 'dark' : 'light';
}

/** A saved choice takes precedence; otherwise the site follows the device theme. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => savedTheme() ?? systemTheme());
  const hasSavedChoice = useRef(savedTheme() !== null);

  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    hasSavedChoice.current = true;
    setTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // The chosen theme still works when browser storage is unavailable.
    }
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0b1720' : '#1b626c');
    document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', theme);
  }, [theme]);

  useEffect(() => {
    const media = window.matchMedia?.(SYSTEM_THEME);
    const onSystemChange = (event: MediaQueryListEvent) => {
      if (!hasSavedChoice.current) setTheme(event.matches ? 'dark' : 'light');
    };
    const onStorageChange = (event: StorageEvent) => {
      if (event.key !== THEME_KEY && event.key !== null) return;
      const saved = savedTheme();
      hasSavedChoice.current = saved !== null;
      setTheme(saved ?? systemTheme());
    };
    media?.addEventListener('change', onSystemChange);
    window.addEventListener('storage', onStorageChange);
    return () => {
      media?.removeEventListener('change', onSystemChange);
      window.removeEventListener('storage', onStorageChange);
    };
  }, []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
