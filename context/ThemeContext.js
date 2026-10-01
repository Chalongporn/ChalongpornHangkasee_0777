import React, { createContext } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const toggleTheme = () => { }; // Dummy function so screens don't break if they call it

  const theme = {
    isDarkMode: true,
    colors: {
      background: '#1c1c1c',
      card: '#2d2d2d',
      text: '#ffffff',
      textSecondary: '#cccccc',
      primary: '#00acc1',
      border: '#444444',
      shadow: '#000000',
      inputBg: '#dcdcdc',
      inputText: '#000000',
      bottomBar: '#2d2d2d',
      headerBackground: '#2d2d2d',
      icon: '#ffffff',
    },
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
