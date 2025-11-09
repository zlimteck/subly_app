import { createContext, useState, useContext, useEffect } from 'react'
import axios from 'axios'
import i18n from '../i18n'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Helper function to sync language with backend
  const syncLanguageWithBackend = async (userData) => {
    const frontendLanguage = i18n.language
    const backendLanguage = userData?.language || 'en'

    // If frontend language differs from backend, update backend
    if (frontendLanguage !== backendLanguage) {
      try {
        await axios.put('/api/auth/push-preferences', {
          language: frontendLanguage
        })
        console.log(`🌍 Language synced to backend: ${frontendLanguage}`)
      } catch (error) {
        console.error('Failed to sync language with backend:', error)
      }
    }
  }

  useEffect(() => {
    // Check if user is logged in on mount
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('user')

      if (token && userData) {
        try {
          // Set token in axios headers
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

          // Verify token with backend
          const response = await axios.get('/api/auth/me')

          // Token is valid (200 or 304), set user
          // For 304 responses, data might be empty but status is success
          if (response.status === 200 || response.status === 304) {
            const parsedUser = JSON.parse(userData)
            setUser(parsedUser)

            // Sync language with backend on mount
            await syncLanguageWithBackend(parsedUser)
          }
        } catch (error) {
          // Token is invalid or expired, clear everything
          console.error('Token validation failed:', error)
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          delete axios.defaults.headers.common['Authorization']
          setUser(null)
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (username, password) => {
    // Clear any existing auth headers before login
    delete axios.defaults.headers.common['Authorization']

    const response = await axios.post('/api/auth/login', { username, password })
    const { token, ...userData } = response.data

    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

    setUser(userData)

    // Sync language with backend after login
    await syncLanguageWithBackend(userData)

    return response.data
  }

  const register = async (username, password, invitationCode, email) => {
    // Clear any existing auth headers before register
    delete axios.defaults.headers.common['Authorization']

    const response = await axios.post('/api/auth/register', { username, password, invitationCode, email })
    const { token, ...userData } = response.data

    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

    setUser(userData)

    // Sync language with backend after registration
    await syncLanguageWithBackend(userData)

    // Refresh user data from backend to ensure we have all fields
    try {
      await refreshUser()
    } catch (error) {
      console.error('Error refreshing user data after registration:', error)
    }

    return response.data
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
  }

  const refreshUser = async () => {
    try {
      const response = await axios.get('/api/auth/me')
      const userData = response.data

      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      return userData
    } catch (error) {
      console.error('Error refreshing user data:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}