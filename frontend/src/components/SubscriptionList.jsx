import { format, differenceInDays } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import { Edit2, Calendar, DollarSign, ExternalLink, LayoutGrid, List, Clock, ArrowUpDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCurrency } from '../context/CurrencyContext'
import { getUploadUrl } from '../utils/api'
import './SubscriptionList.css'

function SubscriptionList({ subscriptions, onEdit, viewMode = 'extended', onToggleView, sortBy, onSortChange }) {
  const { t, i18n } = useTranslation()
  const { formatAmount, currency } = useCurrency()

  if (subscriptions.length === 0) {
    return (
      <div className="empty-state">
        <p className="terminal-prompt">&gt; {t('dashboard.noSubscriptions').toUpperCase()}</p>
        <p className="empty-subtitle">{t('dashboard.getStarted')}</p>
      </div>
    )
  }

  return (
    <div className="subscription-section">
      <div className="section-header">
        <h2 className="section-title">
          <span className="terminal-prompt">&gt;</span> {t('dashboard.subscriptions').toUpperCase()}
        </h2>
        <div className="section-header-actions">
          <div className="sort-dropdown">
            <ArrowUpDown size={16} />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="sort-select"
            >
              <option value="name">{t('subscription.name')} (A-Z)</option>
              <option value="name-desc">{t('subscription.name')} (Z-A)</option>
              <option value="price">{t('subscription.amount')} (Low-High)</option>
              <option value="price-desc">{t('subscription.amount')} (High-Low)</option>
              <option value="category">{t('subscription.category')}</option>
              <option value="date">{t('subscription.nextBilling')} (Soonest)</option>
              <option value="date-desc">{t('subscription.nextBilling')} (Latest)</option>
            </select>
          </div>
          <button onClick={onToggleView} className="btn-view-toggle" title={`${t('common.switchTo')} ${viewMode === 'extended' ? t('common.compact') : t('common.extended')}`}>
            {viewMode === 'extended' ? <List size={18} /> : <LayoutGrid size={18} />}
            <span>{viewMode === 'extended' ? t('common.compact') : t('common.extended')}</span>
          </button>
        </div>
      </div>

      <div className={`subscription-grid ${viewMode === 'compact' ? 'compact-mode' : ''}`}>
        {subscriptions.map((sub) => {
          const trialDaysLeft = sub.isTrial && sub.trialEndDate
            ? differenceInDays(new Date(sub.trialEndDate), new Date())
            : null
          const isTrialEndingSoon = trialDaysLeft !== null && trialDaysLeft >= 0 && trialDaysLeft <= 3

          return (
            <div key={sub._id} className={`subscription-card glow ${sub.isTrial ? 'trial-card' : ''}`}>
              <div className="sub-header">
                <div className="sub-title-row">
                  {(sub.iconFilename || sub.iconUrl) && (
                    <img
                      src={sub.iconFilename ? getUploadUrl(sub.iconFilename) : sub.iconUrl}
                      alt={`${sub.name} icon`}
                      className="sub-icon"
                    />
                  )}
                  <span className={`status-dot ${sub.isActive ? 'active' : 'inactive'}`}></span>
                  <div className="sub-name-wrapper">
                    <h3 className="sub-name terminal-text">
                      {sub.name}
                    </h3>
                    {sub.isTrial && trialDaysLeft !== null && trialDaysLeft >= 0 && (
                      <span className={`trial-badge ${isTrialEndingSoon ? 'ending-soon' : ''}`}>
                        <Clock size={12} /> Trial {trialDaysLeft}d
                      </span>
                    )}
                  </div>
                </div>
              <div className="sub-actions">
                {sub.url && (
                  <a
                    href={sub.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-icon"
                    title={t('subscription.visitService')}
                  >
                    <ExternalLink size={18} />
                  </a>
                )}
                <button
                  onClick={() => onEdit(sub)}
                  className="btn-icon"
                  title={t('subscription.edit')}
                >
                  <Edit2 size={18} />
                </button>
              </div>
            </div>

                <div className="sub-info">
                  {sub.isTrial && sub.trialEndDate && trialDaysLeft !== null && trialDaysLeft >= 0 && (
                    <div className={`info-row trial-info ${isTrialEndingSoon ? 'warning' : ''}`}>
                      <Clock size={16} />
                      <span className="info-label">{t('subscription.trialEnds')}:</span>
                      <span className="info-value">
                        {format(new Date(sub.trialEndDate), 'MMM dd, yyyy', { locale: i18n.language === 'fr' ? fr : enUS })} ({trialDaysLeft}d {t('common.daysLeft')})
                      </span>
                    </div>
                  )}

                  <div className="info-row">
                    <DollarSign size={16} />
                    <span className="info-label">{t('subscription.amount')}:</span>
                    <span className="info-value">
                      {formatAmount(sub.amount)}/{sub.billingCycle === 'monthly' ? t('common.mo') : t('common.yr')}
                    </span>
                  </div>

                  {sub.billingCycle === 'annual' && (
                    <div className="info-row monthly-equivalent">
                      <span className="info-label">{t('subscription.monthly')}:</span>
                      <span className="info-value">{formatAmount(sub.monthlyCost)}/{t('common.mo')}</span>
                    </div>
                  )}

                  <div className="info-row">
                    <Calendar size={16} />
                    <span className="info-label">{t('subscription.nextBilling')}:</span>
                    <span className="info-value">
                      {format(new Date(sub.nextBillingDate), 'MMM dd, yyyy', { locale: i18n.language === 'fr' ? fr : enUS })}
                    </span>
                  </div>

                  {sub.category && (
                    <div className="sub-category">{sub.category}</div>
                  )}

                  {sub.notes && (
                    <div className="sub-notes">{sub.notes}</div>
                  )}
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}

export default SubscriptionList