import { createContext, useState, useContext, useEffect } from 'react'

const ThemeContext = createContext(null)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Load from localStorage or default to dark (terminal theme)
    const saved = localStorage.getItem('theme')
    return saved || 'dark'
  })

  useEffect(() => {
    // Save to localStorage when theme changes
    localStorage.setItem('theme', theme)

    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    // Cycle through themes: dark -> dracula -> nord -> solarized -> light -> dark
    setTheme(prev => {
      if (prev === 'dark') return 'dracula'
      if (prev === 'dracula') return 'nord'
      if (prev === 'nord') return 'solarized'
      if (prev === 'solarized') return 'light'
      return 'dark'
    })
  }

  return (
    <ThemeContext.Provider value={{
      theme,
      setTheme,
      toggleTheme,
      isDark: theme !== 'light'
    }}>
      {children}
    </ThemeContext.Provider>
  )
}