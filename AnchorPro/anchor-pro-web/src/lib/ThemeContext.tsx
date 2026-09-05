'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Dark mode is disabled for now — always render light, regardless of any
  // theme a user previously picked. toggleTheme is kept as a no-op (rather
  // than removed) so call sites don't need to change when this is re-enabled.
  const theme: Theme = 'light';

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    // The bare :root in globals.css is the dark palette — [data-theme="light"] is the
    // override, so forcing light means setting the attribute, not clearing it.
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  const toggleTheme = () => {};

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
