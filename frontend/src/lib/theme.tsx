import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { spillFrom } from './liquid';

export type Theme = 'day' | 'night';
const KEY = 'lifnex_theme';

const read = (): Theme => (document.documentElement.dataset.theme === 'night' ? 'night' : 'day');

interface Ctx {
  theme: Theme;
  toggle: (origin?: { x: number; y: number }) => void;
}
const ThemeCtx = createContext<Ctx>({ theme: 'day', toggle: () => {} });

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(read);

  const commit = useCallback((next: Theme) => {
    document.documentElement.dataset.theme = next;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', next === 'night' ? '#17080b' : '#f8f5f6');
    setTheme(next);
  }, []);

  const toggle = useCallback(
    (origin?: { x: number; y: number }) => {
      const next: Theme = read() === 'night' ? 'day' : 'night';
      try {
        localStorage.setItem(KEY, next);
      } catch {
        /* private mode */
      }
      const { x, y } = origin ?? { x: window.innerWidth / 2, y: 0 };
      spillFrom(x, y, () => commit(next));
    },
    [commit],
  );

  // follow the system until the visitor has chosen
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const on = () => {
      try {
        if (localStorage.getItem(KEY)) return;
      } catch {
        /* ignore */
      }
      commit(mq.matches ? 'night' : 'day');
    };
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [commit]);

  const value = useMemo(() => ({ theme, toggle }), [theme, toggle]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
};

export const useTheme = () => useContext(ThemeCtx);
