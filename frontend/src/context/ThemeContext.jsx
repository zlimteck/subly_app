import { createContext, useState, useContext, useEffect } from 'react'
import axios from 'axios'

const ThemeContext = createContext(null)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
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

  const setTheme = async (newTheme) => {
    setThemeState(newTheme)

    // Sync to backend if user is logged in
    try {
      const token = localStorage.getItem('token')
      if (token) {
        await axios.put('/api/auth/preferences', { theme: newTheme })

        // Update user data in localStorage to keep it in sync
        const userData = localStorage.getItem('user')
        if (userData) {
          const parsedUser = JSON.parse(userData)
          parsedUser.theme = newTheme
          localStorage.setItem('user', JSON.stringify(parsedUser))
        }
      }
    } catch (error) {
      console.error('Failed to sync theme preference:', error)
    }
  }

  const toggleTheme = () => {
    // Cycle through themes: dark -> dracula -> nord -> solarized -> light -> dark
    let newTheme
    if (theme === 'dark') newTheme = 'dracula'
    else if (theme === 'dracula') newTheme = 'nord'
    else if (theme === 'nord') newTheme = 'solarized'
    else if (theme === 'solarized') newTheme = 'light'
    else newTheme = 'dark'

    setTheme(newTheme)
  }

  const loadThemeFromUser = (userTheme) => {
    if (userTheme) {
      setThemeState(userTheme)
      localStorage.setItem('theme', userTheme)
    }
  }

  return (
    <ThemeContext.Provider value={{
      theme,
      setTheme,
      toggleTheme,
      loadThemeFromUser,
      isDark: theme !== 'light'
    }}>
      {children}
    </ThemeContext.Provider>
  )
}