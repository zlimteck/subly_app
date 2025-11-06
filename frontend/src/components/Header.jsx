import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCurrency } from '../context/CurrencyContext'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LogOut, User, DollarSign, Euro, Bell } from 'lucide-react'
import { differenceInDays, parseISO } from 'date-fns'
import NotificationPanel from './NotificationPanel'
import './Header.css'

function Header({ user, subscriptions = [] }) {
  const { logout } = useAuth()
  const { currency, toggleCurrency } = useCurrency()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [showNotifications, setShowNotifications] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Get count of upcoming payments in the next 7 days
  const getUpcomingCount = () => {
    const today = new Date()
    return subscriptions.filter(sub => {
      if (!sub.isActive) return false
      const billingDate = parseISO(sub.nextBillingDate)
      const daysUntil = differenceInDays(billingDate, today)
      return daysUntil >= 0 && daysUntil <= 7
    }).length
  }

  const upcomingCount = getUpcomingCount()

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="logo terminal-text">SUBLY</h1>
          <div className="terminal-breadcrumb">
            <span className="terminal-prompt">root@subly:~$</span>
            <span className="cursor"></span>
          </div>
        </div>

        <div className="header-right">
          <button onClick={toggleCurrency} className="btn-currency" title={t('header.toggleCurrency')}>
            {currency === 'USD' ? <DollarSign size={18} /> : <Euro size={18} />}
            <span>{currency}</span>
          </button>
          <div className="notification-wrapper">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="btn-notification"
              title={t('header.notifications')}
            >
              <Bell size={18} />
              {upcomingCount > 0 && (
                <span className="notification-badge">{upcomingCount}</span>
              )}
            </button>
            {showNotifications && (
              <NotificationPanel
                subscriptions={subscriptions}
                onClose={() => setShowNotifications(false)}
              />
            )}
          </div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('openProfile'))}
            className="user-info user-info-button"
            title={t('header.openProfile')}
          >
            <User size={18} />
            <span>{user?.username}</span>
          </button>
          <button onClick={handleLogout} className="btn-logout">
            <LogOut size={18} />
            <span>{t('auth.logout').toUpperCase()}</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header