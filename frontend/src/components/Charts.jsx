import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { useTranslation } from 'react-i18next'
import { useCurrency } from '../context/CurrencyContext'
import { useTheme } from '../context/ThemeContext'
import './Charts.css'

function Charts({ subscriptions, stats }) {
  const { t } = useTranslation()
  const { formatAmount } = useCurrency()
  const { theme } = useTheme()

  // Get CSS variables for theme-aware colors
  const getColors = () => {
    const style = getComputedStyle(document.documentElement)
    return {
      primary: style.getPropertyValue('--terminal-green').trim(),
      primaryDark: style.getPropertyValue('--terminal-green-dark').trim(),
      primaryLight: style.getPropertyValue('--terminal-green-light').trim(),
      textDim: style.getPropertyValue('--text-dim').trim(),
      borderColor: style.getPropertyValue('--border-color').trim()
    }
  }

  const [colors, setColors] = useState(getColors())

  // Update colors when theme changes
  useEffect(() => {
    // Small delay to ensure CSS variables are updated
    const timer = setTimeout(() => {
      setColors(getColors())
    }, 0)
    return () => clearTimeout(timer)
  }, [theme])

  // Helper to normalize category names for translation
  const normalizeCategoryKey = (category) => {
    // Handle old "Cloud Storage" category name
    if (category.toLowerCase() === 'cloud storage') {
      return 'cloud'
    }
    return category.toLowerCase()
  }

  // Prepare data for pie chart (by category)
  const categoryData = Object.entries(stats.byCategory).map(([name, value]) => ({
    name: t(`categories.${normalizeCategoryKey(name)}`),
    value: Math.round(value * 100) / 100
  }))

  // Prepare data for bar chart (individual subscriptions)
  const subData = subscriptions
    .filter(sub => sub.isActive)
    .map(sub => ({
      name: sub.name.length > 15 ? sub.name.substring(0, 15) + '...' : sub.name,
      monthly: Math.round(sub.monthlyCost * 100) / 100,
      total: Math.round(sub.amount * 100) / 100,
      cycle: sub.billingCycle
    }))
    .sort((a, b) => b.monthly - a.monthly)
    .slice(0, 10)

  const COLORS = [
    colors.primary,
    colors.primaryDark,
    colors.primaryLight,
    colors.primary,
    colors.primaryDark,
    colors.primaryLight,
    colors.primary,
    colors.primaryDark
  ]

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{payload[0].name}</p>
          <p className="value">{formatAmount(payload[0].value)}/{t('charts.mo')}</p>
        </div>
      )
    }
    return null
  }

  const CustomBarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="custom-tooltip">
          <p className="label">{data.name}</p>
          <p className="value">{formatAmount(data.monthly)}/{t('charts.mo')}</p>
          {data.cycle === 'annual' && (
            <p className="cycle">{formatAmount(data.total)}/{t('charts.year')}</p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className="charts-container" key={theme}>
      <div className="chart-card glow">
        <h3 className="chart-title">
          <span className="terminal-prompt">&gt;</span> {t('charts.byCategory').toUpperCase()}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart key={`pie-${theme}`}>
            <Pie
              data={categoryData}
              cx="50%"
              cy="45%"
              labelLine={false}
              label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
              outerRadius={85}
              fill="#8884d8"
              dataKey="value"
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', color: colors.textDim }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card glow">
        <h3 className="chart-title">
          <span className="terminal-prompt">&gt;</span> {t('charts.topSubscriptions').toUpperCase()}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={subData} key={`bar-${theme}`}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.borderColor} />
            <XAxis
              dataKey="name"
              stroke={colors.textDim}
              tick={{ fill: colors.textDim, fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              stroke={colors.textDim}
              tick={{ fill: colors.textDim, fontSize: 12 }}
            />
            <Tooltip content={<CustomBarTooltip />} cursor={{ fill: `${colors.primary}1a` }} />
            <Bar dataKey="monthly" fill={colors.primary} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default Charts