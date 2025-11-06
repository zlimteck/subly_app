import { Bell, Calendar, DollarSign, Clock } from 'lucide-react'
import { format, differenceInDays, parseISO } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'
import { useCurrency } from '../context/CurrencyContext'
import { getUploadUrl } from '../utils/api'
import './NotificationPanel.css'

function NotificationPanel({ subscriptions, onClose }) {
  const { t, i18n } = useTranslation()
  const { formatAmount } = useCurrency()

  // Get upcoming subscriptions in the next 7 days
  const getUpcomingSubscriptions = () => {
    const today = new Date()

    return subscriptions
      .filter(sub => {
        if (!sub.isActive || sub.isTrial) return false // Exclude trials
        const billingDate = parseISO(sub.nextBillingDate)
        const daysUntil = differenceInDays(billingDate, today)
        return daysUntil >= 0 && daysUntil <= 7
      })
      .sort((a, b) => {
        const dateA = parseISO(a.nextBillingDate)
        const dateB = parseISO(b.nextBillingDate)
        return dateA - dateB
      })
  }

  // Get trials ending in the next 7 days
  const getEndingTrials = () => {
    const today = new Date()

    return subscriptions
      .filter(sub => {
        if (!sub.isActive || !sub.isTrial || !sub.trialEndDate) return false
        const trialEndDate = parseISO(sub.trialEndDate)
        const daysUntil = differenceInDays(trialEndDate, today)
        return daysUntil >= 0 && daysUntil <= 7
      })
      .sort((a, b) => {
        const dateA = parseISO(a.trialEndDate)
        const dateB = parseISO(b.trialEndDate)
        return dateA - dateB
      })
  }

  const upcomingSubscriptions = getUpcomingSubscriptions()
  const endingTrials = getEndingTrials()

  const getDaysUntilText = (date) => {
    const billingDate = parseISO(date)
    const daysUntil = differenceInDays(billingDate, new Date())

    if (daysUntil === 0) return t('notifications.today')
    if (daysUntil === 1) return t('notifications.tomorrow')
    return t('notifications.inDays', { count: daysUntil })
  }

  const getTotalUpcoming = () => {
    return upcomingSubscriptions.reduce((total, sub) => total + sub.amount, 0)
  }

  return (
    <div className="notification-panel">
      <div className="notification-header">
        <div className="notification-title">
          <Bell size={18} />
          <span>{t('notifications.title').toUpperCase()}</span>
        </div>
        <button onClick={onClose} className="btn-close-notification">
          ×
        </button>
      </div>

      <div className="notification-content">
        {/* Trial Reminders Section */}
        {endingTrials.length > 0 && (
          <div className="notification-section">
            <div className="notification-section-title">
              <Clock size={16} />
              <span>{t('notifications.trialsEndingSoon').toUpperCase()}</span>
            </div>
            <div className="notification-list">
              {endingTrials.map(sub => {
                const daysUntil = differenceInDays(parseISO(sub.trialEndDate), new Date())
                const isEndingSoon = daysUntil >= 0 && daysUntil <= 3

                return (
                  <div key={sub._id} className={`notification-item ${isEndingSoon ? 'trial-warning' : 'trial-notice'}`}>
                    <div className="notification-item-header">
                      {sub.iconFilename && (
                        <img src={getUploadUrl(sub.iconFilename)} alt={sub.name} className="notification-icon" />
                      )}
                      {!sub.iconFilename && sub.iconUrl && (
                        <img src={sub.iconUrl} alt={sub.name} className="notification-icon" />
                      )}
                      {!sub.iconFilename && !sub.iconUrl && (
                        <div className="notification-icon-placeholder">
                          {sub.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="notification-item-info">
                        <div className="notification-item-name">{sub.name}</div>
                        <div className="notification-item-details">
                          <span className="notification-date">
                            <Clock size={12} />
                            {t('notifications.trialEnds')} {format(parseISO(sub.trialEndDate), 'MMM d', { locale: i18n.language === 'fr' ? fr : enUS })}
                          </span>
                        </div>
                      </div>
                      <div className={`notification-days ${isEndingSoon ? 'ending-soon' : ''}`}>
                        {getDaysUntilText(sub.trialEndDate)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Upcoming Payments Section */}
        {upcomingSubscriptions.length === 0 && endingTrials.length === 0 ? (
          <div className="no-notifications">
            <span className="terminal-prompt">&gt;</span> {t('notifications.noNotifications')}
          </div>
        ) : upcomingSubscriptions.length > 0 ? (
          <div className="notification-section">
            <div className="notification-section-title">
              <DollarSign size={16} />
              <span>{t('notifications.upcomingPayments').toUpperCase()}</span>
            </div>
            <div className="notification-summary">
              <span className="terminal-prompt">&gt;</span> {t('notifications.totalUpcoming')}: {formatAmount(getTotalUpcoming())}
            </div>
            <div className="notification-list">
              {upcomingSubscriptions.map(sub => (
                <div key={sub._id} className="notification-item">
                  <div className="notification-item-header">
                    {sub.iconFilename && (
                      <img src={getUploadUrl(sub.iconFilename)} alt={sub.name} className="notification-icon" />
                    )}
                    {!sub.iconFilename && sub.iconUrl && (
                      <img src={sub.iconUrl} alt={sub.name} className="notification-icon" />
                    )}
                    {!sub.iconFilename && !sub.iconUrl && (
                      <div className="notification-icon-placeholder">
                        {sub.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="notification-item-info">
                      <div className="notification-item-name">{sub.name}</div>
                      <div className="notification-item-details">
                        <span className="notification-date">
                          <Calendar size={12} />
                          {format(parseISO(sub.nextBillingDate), 'MMM d', { locale: i18n.language === 'fr' ? fr : enUS })}
                        </span>
                        <span className="notification-amount">
                          <DollarSign size={12} />
                          {formatAmount(sub.amount)}
                        </span>
                      </div>
                    </div>
                    <div className="notification-days">
                      {getDaysUntilText(sub.nextBillingDate)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default NotificationPanel