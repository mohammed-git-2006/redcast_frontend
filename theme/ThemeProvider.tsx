import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import { darkTheme, lightTheme } from './theme';

const ThemeContext = createContext({});

export function ThemeProvider({ children }) {
  const colorScheme = Appearance.getColorScheme(); // light or dark
  const [theme, setTheme] = useState(
    colorScheme === 'dark' ? darkTheme : lightTheme
  );

  useEffect(() => {
    const listener = Appearance.addChangeListener(({ colorScheme }) => {
      setTheme(colorScheme === 'dark' ? darkTheme : lightTheme);
    });
    return () => listener.remove();
  }, []);

  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
