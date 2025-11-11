import { createContext, useState, useContext, useEffect } from 'react'
import axios from 'axios'

const CurrencyContext = createContext(null)

export const useCurrency = () => {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider')
  }
  return context
}

const CURRENCIES = {
  USD: { symbol: '$', code: 'USD', name: 'US Dollar' },
  EUR: { symbol: '€', code: 'EUR', name: 'Euro' }
}

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => {
    // Load from localStorage or default to EUR
    const saved = localStorage.getItem('currency')
    return saved || 'EUR'
  })

  useEffect(() => {
    // Save to localStorage when currency changes
    localStorage.setItem('currency', currency)
  }, [currency])

  const formatAmount = (amount) => {
    const curr = CURRENCIES[currency]
    const formatted = amount.toFixed(2)
    return currency === 'EUR' ? `${formatted}${curr.symbol}` : `${curr.symbol}${formatted}`
  }

  const getCurrencySymbol = () => {
    return CURRENCIES[currency].symbol
  }

  const toggleCurrency = async () => {
    const newCurrency = currency === 'USD' ? 'EUR' : 'USD'
    setCurrency(newCurrency)

    // Sync to backend if user is logged in
    try {
      const token = localStorage.getItem('token')
      if (token) {
        await axios.put('/api/auth/preferences', { currency: newCurrency })

        // Update user data in localStorage to keep it in sync
        const userData = localStorage.getItem('user')
        if (userData) {
          const parsedUser = JSON.parse(userData)
          parsedUser.currency = newCurrency
          localStorage.setItem('user', JSON.stringify(parsedUser))
        }
      }
    } catch (error) {
      console.error('Failed to sync currency preference:', error)
    }
  }

  const loadCurrencyFromUser = (userCurrency) => {
    if (userCurrency && CURRENCIES[userCurrency]) {
      setCurrency(userCurrency)
      localStorage.setItem('currency', userCurrency)
    }
  }

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency,
      formatAmount,
      getCurrencySymbol,
      toggleCurrency,
      loadCurrencyFromUser,
      currencies: CURRENCIES
    }}>
      {children}
    </CurrencyContext.Provider>
  )
}