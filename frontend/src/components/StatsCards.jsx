import { DollarSign, TrendingUp, Calendar, Hash, Percent } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCurrency } from '../context/CurrencyContext'
import { useAuth } from '../context/AuthContext'
import './StatsCards.css'

function StatsCards({ stats }) {
  const { formatAmount } = useCurrency()
  const { t } = useTranslation()
  const { user } = useAuth()

  // Calculate expense ratios if revenue is set
  const monthlyRevenue = user?.monthlyRevenue || 0
  const annualRevenue = user?.annualRevenue || 0
  const hasMonthlyRevenue = monthlyRevenue > 0
  const hasAnnualRevenue = annualRevenue > 0

  // Monthly ratio: only pure monthly subscriptions (excluding annual subs) vs monthly revenue
  const monthlyExpenseRatio = hasMonthlyRevenue
    ? ((stats.totalMonthlyOnly / monthlyRevenue) * 100).toFixed(1)
    : null

  // Annual ratio: (monthly subs × 12) + annual subs vs annual revenue
  const totalAnnualSpending = (stats.totalMonthlyOnly * 12) + stats.totalAnnual
  const annualExpenseRatio = hasAnnualRevenue
    ? ((totalAnnualSpending / annualRevenue) * 100).toFixed(1)
    : null

  const cards = [
    {
      title: t('dashboard.monthlySubscriptions').toUpperCase(),
      value: formatAmount(stats.totalMonthlyOnly),
      icon: DollarSign,
      subtitle: t('common.perMonth')
    },
    {
      title: t('dashboard.annualSubscriptions').toUpperCase(),
      value: formatAmount(stats.totalAnnual),
      icon: Calendar,
      subtitle: t('common.perYear')
    },
    {
      title: t('dashboard.totalYearly').toUpperCase(),
      value: formatAmount(stats.totalYearly),
      icon: TrendingUp,
      subtitle: t('dashboard.totalPerYear')
    },
    {
      title: t('dashboard.activeSubscriptions').toUpperCase(),
      value: stats.count,
      icon: Hash,
      subtitle: t('dashboard.subscriptions').toLowerCase()
    }
  ]

  // Add expense ratio cards if revenue is configured
  if (monthlyExpenseRatio !== null) {
    cards.push({
      title: t('dashboard.monthlyExpenseRatio').toUpperCase(),
      value: `${monthlyExpenseRatio}%`,
      icon: Percent,
      subtitle: t('dashboard.ofMonthlyRevenue')
    })
  }

  if (annualExpenseRatio !== null) {
    cards.push({
      title: t('dashboard.annualExpenseRatio').toUpperCase(),
      value: `${annualExpenseRatio}%`,
      icon: Percent,
      subtitle: t('dashboard.ofAnnualRevenue')
    })
  }

  return (
    <div className="stats-grid">
      {cards.map((card, index) => (
        <div key={index} className="stat-card glow">
          <div className="stat-header">
            <card.icon size={24} />
            <h3>{card.title}</h3>
          </div>
          <div className="stat-value terminal-text">{card.value}</div>
          <div className="stat-subtitle">{card.subtitle}</div>
        </div>
      ))}
    </div>
  )
}

export default StatsCards