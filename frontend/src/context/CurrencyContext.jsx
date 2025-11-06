import { createContext, useState, useContext, useEffect } from 'react'

const CurrencyContext = createContext(null)

export const useCurrency = () => {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error('useAuth must be used within CurrencyProvider')
  }
  return context
}

const CURRENCIES = {
  USD: { symbol: '$', code: 'USD', name: 'US Dollar' },
  EUR: { symbol: '€', code: 'EUR', name: 'Euro' }
}

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => {
    // Load from localStorage or default to USD
    const saved = localStorage.getItem('currency')
    return saved || 'USD'
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

  const toggleCurrency = () => {
    setCurrency(prev => prev === 'USD' ? 'EUR' : 'USD')
  }

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency,
      formatAmount,
      getCurrencySymbol,
      toggleCurrency,
      currencies: CURRENCIES
    }}>
      {children}
    </CurrencyContext.Provider>
  )
}