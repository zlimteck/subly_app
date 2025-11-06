import { Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CATEGORIES } from '../constants/categories'
import './SearchFilters.css'

function SearchFilters({ filters, onFilterChange, onClearFilters }) {
  const { t } = useTranslation()

  // Helper function to convert category name to translation key
  const getCategoryKey = (category) => {
    const keyMap = {
      'AI': 'ai',
      'Cloud Storage': 'cloud',
      'Education': 'education',
      'Entertainment': 'entertainment',
      'Fitness': 'fitness',
      'Gaming': 'gaming',
      'Mobile': 'mobile',
      'Music': 'music',
      'News': 'news',
      'Productivity': 'productivity',
      'Software': 'software',
      'Streaming': 'streaming',
      'Other': 'other'
    }
    return keyMap[category] || category.toLowerCase()
  }

  const hasActiveFilters = filters.search || filters.category !== 'All' || filters.status !== 'all' || filters.billingCycle !== 'all'

  return (
    <div className="search-filters">
      <div className="search-bar">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder={t('common.search')}
          value={filters.search}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          className="search-input"
        />
        {filters.search && (
          <button
            onClick={() => onFilterChange({ ...filters, search: '' })}
            className="clear-search"
            title={t('common.search')}
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="filters-row">
        <div className="filter-group">
          <label>
            <span className="terminal-prompt">&gt;</span> {t('subscription.category').toUpperCase()}
          </label>
          <select
            value={filters.category}
            onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
            className="filter-select"
          >
            <option value="All">{t('common.all')}</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{t(`categories.${getCategoryKey(cat)}`)}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>
            <span className="terminal-prompt">&gt;</span> {t('subscription.status').toUpperCase()}
          </label>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
            className="filter-select"
          >
            <option value="all">{t('common.all')}</option>
            <option value="active">{t('subscription.active')}</option>
            <option value="inactive">{t('subscription.inactive')}</option>
          </select>
        </div>

        <div className="filter-group">
          <label>
            <span className="terminal-prompt">&gt;</span> {t('subscription.billingCycle').toUpperCase()}
          </label>
          <select
            value={filters.billingCycle}
            onChange={(e) => onFilterChange({ ...filters, billingCycle: e.target.value })}
            className="filter-select"
          >
            <option value="all">{t('common.all')}</option>
            <option value="monthly">{t('subscription.monthly')}</option>
            <option value="annual">{t('subscription.annual')}</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button onClick={onClearFilters} className="btn-clear-filters" title={t('common.clearFilters')}>
            <X size={16} />
            {t('common.clearFilters').toUpperCase()}
          </button>
        )}
      </div>
    </div>
  )
}

export default SearchFilters