import { createContext, useContext, useEffect, useState } from 'react';

import type { ThemeMode } from '@/domain/playback/types';

interface ThemeContextValue {
  effectiveTheme: 'dark' | 'light';
}

const ThemeContext = createContext<ThemeContextValue>({
  effectiveTheme: 'dark',
});

const resolveTheme = (themeMode: ThemeMode): 'dark' | 'light' => {
  if (themeMode === 'dark') {
    return 'dark';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const ThemeProvider = ({
  children,
  mode,
}: React.PropsWithChildren<{ mode: ThemeMode }>) => {
  const [effectiveTheme, setEffectiveTheme] = useState<'dark' | 'light'>(() =>
    resolveTheme(mode),
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const nextTheme = resolveTheme(mode);
      document.documentElement.dataset.theme = nextTheme;
      setEffectiveTheme(nextTheme);
    };

    apply();
    mediaQuery.addEventListener('change', apply);
    return () => mediaQuery.removeEventListener('change', apply);
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ effectiveTheme }}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
