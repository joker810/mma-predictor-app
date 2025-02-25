// context/ThemeContext.jsx
import React, { createContext, useState, useContext } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light'); // Light default

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Force immediate re-render for smooth transitions
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {React.useMemo(() => children, [theme, children])}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}