// contexts/ThemeContext.js
import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isWhiteMode, setIsWhiteMode] = useState(false);

  const toggleTheme = () => setIsWhiteMode((prevMode) => !prevMode);

  return (
    <ThemeContext.Provider value={{ isWhiteMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
