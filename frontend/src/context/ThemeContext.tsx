import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  darkMode: boolean;
  largeText: boolean;
  toggleDarkMode: () => void;
  toggleLargeText: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState<boolean>(
    localStorage.getItem('darkMode') !== 'false'
  );
  const [largeText, setLargeText] = useState<boolean>(
    localStorage.getItem('largeText') === 'true'
  );

  useEffect(() => {
    // Sync dark mode class
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  useEffect(() => {
    // Sync accessibility text scaling class
    if (largeText) {
      document.documentElement.classList.add('large-text-mode');
      localStorage.setItem('largeText', 'true');
    } else {
      document.documentElement.classList.remove('large-text-mode');
      localStorage.setItem('largeText', 'false');
    }
  }, [largeText]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);
  const toggleLargeText = () => setLargeText(prev => !prev);

  return (
    <ThemeContext.Provider value={{ darkMode, largeText, toggleDarkMode, toggleLargeText }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
