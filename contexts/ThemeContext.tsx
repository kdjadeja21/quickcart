"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  effectiveTheme: 'dark' | 'light';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  const [effectiveTheme, setEffectiveTheme] = useState<'dark' | 'light'>('light');

  // Load persisted theme on client after mount to avoid SSR localStorage access
  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? (localStorage.getItem('theme') as Theme | null) : null;
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setTheme(stored);
      }
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateEffectiveTheme = () => {
      if (theme === 'system') {
        setEffectiveTheme(mediaQuery.matches ? 'dark' : 'light');
      } else {
        setEffectiveTheme(theme);
      }
    };

    updateEffectiveTheme();
    
    if (theme === 'system') {
      mediaQuery.addEventListener('change', updateEffectiveTheme);
      return () => mediaQuery.removeEventListener('change', updateEffectiveTheme);
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(effectiveTheme);
  }, [theme, effectiveTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, effectiveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
