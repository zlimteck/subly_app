import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import axios from 'axios'
import Header from '../components/Header'
import StatsCards from '../components/StatsCards'
import SubscriptionList from '../components/SubscriptionList'
import SubscriptionForm from '../components/SubscriptionForm'
import Charts from '../components/Charts'
import Calendar from '../components/Calendar'
import SearchFilters from '../components/SearchFilters'
import ProfileModal from '../components/ProfileModal'
import ScrollToTop from '../components/ScrollToTop'
import { updateBadge, clearBadge } from '../utils/badge'
import './Dashboard.css'

function Dashboard() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const location = useLocation()
  const [subscriptions, setSubscriptions] = useState([])
  const [stats, setStats] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSub, setEditingSub] = useState(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [viewMode, setViewMode] = useState(() => {
    // Load from localStorage or default to 'extended'
    return localStorage.getItem('viewMode') || 'extended'
  })
  const [filters, setFilters] = useState({
    search: '',
    category: 'All',
    status: 'all',
    billingCycle: 'all',
    shared: 'all'
  })
  const [sortBy, setSortBy] = useState(() => {
    // Load from localStorage or default to 'name'
    return localStorage.getItem('sortBy') || 'name'
  })

  useEffect(() => {
    fetchData()

    // Expose reloadCategories function globally for SubscriptionForm
    window.reloadCategories = async () => {
      try {
        const categoriesRes = await axios.get('/api/categories')
        setCategories(categoriesRes.data)
      } catch (error) {
        console.error('Error reloading categories:', error)
      }
    }

    return () => {
      delete window.reloadCategories
    }
  }, [])

  useEffect(() => {
    const handleOpenProfile = () => setShowProfileModal(true)
    window.addEventListener('openProfile', handleOpenProfile)
    return () => window.removeEventListener('openProfile', handleOpenProfile)
  }, [])

  // Handle PWA shortcuts - Détecte l'état openAddModal
  useEffect(() => {
    if (location.state?.openAddModal) {
      setShowForm(true)
      setEditingSub(null)

      // Nettoie le state pour éviter de réouvrir au refresh
      window.history.replaceState({}, document.title)
    }
  }, [location])

  // Update app badge when subscriptions change
  useEffect(() => {
    updateBadge(subscriptions)

    // Clear badge when user leaves the app
    return () => {
      // Only clear if navigating away from dashboard
      if (!window.location.pathname.includes('dashboard')) {
        clearBadge()
      }
    }
  }, [subscriptions])

  useEffect(() => {
    // Save view mode to localStorage
    localStorage.setItem('viewMode', viewMode)
  }, [viewMode])

  useEffect(() => {
    // Save sort preference to localStorage
    localStorage.setItem('sortBy', sortBy)
  }, [sortBy])

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'extended' ? 'compact' : 'extended')
  }

  const fetchData = async () => {
    try {
      const [subsRes, statsRes, categoriesRes] = await Promise.all([
        axios.get('/api/subscriptions'),
        axios.get('/api/subscriptions/stats'),
        axios.get('/api/categories')
      ])
      setSubscriptions(subsRes.data)
      setStats(statsRes.data)
      setCategories(categoriesRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSubscription = async (data) => {
    try {
      if (editingSub) {
        await axios.put(`/api/subscriptions/${editingSub._id}`, data)
      } else {
        await axios.post('/api/subscriptions', data)
      }
      await fetchData()
      setShowForm(false)
      setEditingSub(null)
    } catch (error) {
      console.error('Error saving subscription:', error)
      throw error
    }
  }

  const handleEdit = (subscription) => {
    setEditingSub(subscription)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm(t('subscription.delete') + '?')) {
      try {
        await axios.delete(`/api/subscriptions/${id}`)
        await fetchData()
        // Close the form and reset editing state
        setShowForm(false)
        setEditingSub(null)
      } catch (error) {
        console.error('Error deleting subscription:', error)
      }
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingSub(null)
  }

  const handleClearFilters = () => {
    setFilters({
      search: '',
      category: 'All',
      status: 'all',
      billingCycle: 'all',
      shared: 'all'
    })
  }

  // Filter and sort subscriptions
  const filteredSubscriptions = subscriptions
    .filter(sub => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesName = sub.name.toLowerCase().includes(searchLower)
        const matchesCategory = sub.category?.toLowerCase().includes(searchLower)
        const matchesNotes = sub.notes?.toLowerCase().includes(searchLower)
        if (!matchesName && !matchesCategory && !matchesNotes) {
          return false
        }
      }

      // Category filter
      if (filters.category !== 'All' && sub.category !== filters.category) {
        return false
      }

      // Status filter
      if (filters.status !== 'all') {
        if (filters.status === 'active' && !sub.isActive) return false
        if (filters.status === 'inactive' && sub.isActive) return false
      }

      // Billing cycle filter
      if (filters.billingCycle !== 'all' && sub.billingCycle !== filters.billingCycle) {
        return false
      }

      // Shared filter
      if (filters.shared !== 'all') {
        if (filters.shared === 'shared' && !sub.isShared) return false
        if (filters.shared === 'notShared' && sub.isShared) return false
      }

      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        case 'price':
          return (a.monthlyCost || 0) - (b.monthlyCost || 0)
        case 'price-desc':
          return (b.monthlyCost || 0) - (a.monthlyCost || 0)
        case 'category':
          return (a.category || '').localeCompare(b.category || '')
        case 'date':
          return new Date(a.nextBillingDate) - new Date(b.nextBillingDate)
        case 'date-desc':
          return new Date(b.nextBillingDate) - new Date(a.nextBillingDate)
        default:
          return 0
      }
    })

  if (loading) {
    return (
      <div className="dashboard loading">
        <div className="terminal-prompt">{t('common.loading').toUpperCase()}<span className="cursor"></span></div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <Header user={user} subscriptions={subscriptions} />
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        subscriptions={subscriptions}
      />

      <main className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="terminal-text">
            <span className="terminal-prompt">&gt;</span> {t('dashboard.title').toUpperCase()}
          </h1>
          <button
            className="btn-primary"
            onClick={() => {
              if (showForm) {
                // Cancel: close form and reset editing state
                setShowForm(false)
                setEditingSub(null)
              } else {
                // Open form for new subscription
                setEditingSub(null)
                setShowForm(true)
              }
            }}
          >
            {showForm ? t('common.cancel').toUpperCase() : '+ ' + t('dashboard.addSubscription').toUpperCase()}
          </button>
        </div>

        {showForm && (
          <SubscriptionForm
            onSubmit={handleAddSubscription}
            onCancel={handleCancel}
            onDelete={handleDelete}
            initialData={editingSub}
            categories={categories}
          />
        )}

        {stats && <StatsCards stats={stats} />}

        {subscriptions.length > 0 && (
          <>
            <SearchFilters
              filters={filters}
              onFilterChange={setFilters}
              onClearFilters={handleClearFilters}
              categories={categories}
            />

            <SubscriptionList
              subscriptions={filteredSubscriptions}
              onEdit={handleEdit}
              viewMode={viewMode}
              onToggleView={toggleViewMode}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />

            <Calendar subscriptions={filteredSubscriptions} />

            {stats && (
              <Charts subscriptions={filteredSubscriptions} stats={stats} />
            )}
          </>
        )}

        {subscriptions.length === 0 && !loading && (
          <div className="empty-state">
            <p className="terminal-prompt">&gt; {t('dashboard.noSubscriptions').toUpperCase()}</p>
            <p className="empty-subtitle">{t('dashboard.getStarted')}</p>
          </div>
        )}
      </main>

      <ScrollToTop />
    </div>
  )
}

export default Dashboard