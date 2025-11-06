import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCurrency } from '../context/CurrencyContext'
import { Clock, CheckCircle, XCircle, Trash2, Copy, Plus, Users, Key } from 'lucide-react'
import axios from 'axios'
import { format } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'
import HeaderAdmin from '../components/HeaderAdmin'
import UserManagement from '../components/UserManagement'
import './AdminPanel.css'

function AdminPanel() {
  const { user } = useAuth()
  const { formatAmount } = useCurrency()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  // Tab state
  const [activeTab, setActiveTab] = useState('invitations')

  // Invitations state
  const [invitations, setInvitations] = useState([])
  const [stats, setStats] = useState({ total: 0, active: 0, used: 0, expired: 0 })
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Generation form
  const [count, setCount] = useState(1)
  const [expiresInDays, setExpiresInDays] = useState('')
  const [note, setNote] = useState('')

  // Users management state
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [searchUsers, setSearchUsers] = useState('')
  const [usersPage, setUsersPage] = useState(1)
  const [usersPagination, setUsersPagination] = useState({})
  const [includeDeleted, setIncludeDeleted] = useState(false)

  // User modals
  const [showSoftDeleteModal, setShowSoftDeleteModal] = useState(false)
  const [showHardDeleteModal, setShowHardDeleteModal] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [confirmUsername, setConfirmUsername] = useState('')

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/dashboard')
      return
    }
    fetchInvitations()
  }, [user, navigate])

  const fetchInvitations = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/invitations')
      setInvitations(response.data.invitations)
      setStats(response.data.stats)
    } catch (err) {
      setError(t('admin.errorLoadInvitations'))
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setGenerating(true)

    try {
      const payload = {
        count: parseInt(count),
        ...(expiresInDays && { expiresInDays: parseInt(expiresInDays) }),
        ...(note && { note })
      }

      const response = await axios.post('/api/invitations/generate', payload)
      setSuccess(t(count > 1 ? 'admin.generateSuccessPlural' : 'admin.generateSuccess', { count }))

      // Reset form
      setCount(1)
      setExpiresInDays('')
      setNote('')

      // Refresh list
      fetchInvitations()
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || t('admin.errorGenerateCodes')
      setError(errorMessage)
    } finally {
      setGenerating(false)
    }
  }

  const handleRevoke = async (code) => {
    if (!confirm(t('admin.confirmRevoke', { code }))) {
      return
    }

    try {
      await axios.delete(`/api/invitations/${code}`)
      setSuccess(t('admin.revokeSuccess', { code }))
      fetchInvitations()
    } catch (err) {
      setError(err.response?.data?.message || t('admin.errorRevoke'))
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setSuccess(t('admin.copiedToClipboard', { text }))
    setTimeout(() => setSuccess(''), 2000)
  }

  const getStatusBadge = (invitation) => {
    if (invitation.isUsed) {
      return <span className="status-badge used"><CheckCircle size={14} /> {t('admin.statusUsed')}</span>
    }
    if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
      return <span className="status-badge expired"><XCircle size={14} /> {t('admin.statusExpired')}</span>
    }
    return <span className="status-badge active"><Clock size={14} /> {t('admin.statusActive')}</span>
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  return (
    <div className="admin-panel">
      <HeaderAdmin />

      <main className="dashboard-content">
      {/* Tabs Navigation */}
      <div className="admin-tabs">
        <button
          className={`tab-button ${activeTab === 'invitations' ? 'active' : ''}`}
          onClick={() => setActiveTab('invitations')}
        >
          <Key size={18} />
          {t('admin.tabInvitationCodes')}
        </button>
        <button
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={18} />
          {t('admin.tabUserManagement')}
        </button>
      </div>

      {/* Tab Content: Invitations */}
      {activeTab === 'invitations' && (
        <>
          {/* Stats Cards */}
          <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">{t('admin.totalCodes')}</div>
        </div>
        <div className="stat-card active">
          <div className="stat-value">{stats.active}</div>
          <div className="stat-label">{t('admin.active')}</div>
        </div>
        <div className="stat-card used">
          <div className="stat-value">{stats.used}</div>
          <div className="stat-label">{t('admin.used')}</div>
        </div>
        <div className="stat-card expired">
          <div className="stat-value">{stats.expired}</div>
          <div className="stat-label">{t('admin.expired')}</div>
        </div>
      </div>

      {/* Generate Form */}
      <div className="generate-section">
        <h2 className="section-title">
          <span className="terminal-prompt">&gt;</span> {t('admin.generateNewCodes')}
        </h2>

        <form onSubmit={handleGenerate} className="generate-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="count">{t('admin.numberOfCodes')}</label>
              <input
                id="count"
                type="number"
                min="1"
                max="100"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="expiresInDays">{t('admin.expiresInDays')}</label>
              <input
                id="expiresInDays"
                type="number"
                min="1"
                max="365"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
                placeholder={t('admin.neverExpires')}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="note">{t('admin.noteOptional')}</label>
            <input
              id="note"
              type="text"
              maxLength="200"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('admin.notePlaceholder')}
            />
          </div>

          {error && <div className="message error-message">{error}</div>}
          {success && <div className="message success-message">{success}</div>}

          <button type="submit" disabled={generating} className="btn-generate">
            <Plus size={18} />
            {generating ? t('admin.generating') : t(count > 1 ? 'admin.generateCountPlural' : 'admin.generateCount', { count })}
          </button>
        </form>
      </div>

      {/* Invitations List */}
      <div className="invitations-section">
        <h2 className="section-title">
          <span className="terminal-prompt">&gt;</span> {t('admin.allInvitationCodes')}
        </h2>

        {loading ? (
          <div className="loading">{t('admin.loadingInvitations')}</div>
        ) : invitations.length === 0 ? (
          <div className="empty-state">
            <p>{t('admin.noInvitationCodes')}</p>
          </div>
        ) : (
          <div className="invitations-table">
            <table>
              <thead>
                <tr>
                  <th>{t('admin.code')}</th>
                  <th>{t('admin.status')}</th>
                  <th>{t('admin.created')}</th>
                  <th>{t('admin.expires')}</th>
                  <th>{t('admin.usedBy')}</th>
                  <th>{t('admin.usedAt')}</th>
                  <th>{t('admin.note')}</th>
                  <th>{t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((inv) => (
                  <tr key={inv._id} className={inv.isUsed ? 'used-row' : ''}>
                    <td className="code-cell">
                      <code>{inv.code}</code>
                      <button
                        className="btn-copy"
                        onClick={() => copyToClipboard(inv.code)}
                        title={t('admin.copyCode')}
                      >
                        <Copy size={14} />
                      </button>
                    </td>
                    <td>{getStatusBadge(inv)}</td>
                    <td>{format(new Date(inv.createdAt), 'MMM dd, yyyy', { locale: i18n.language === 'fr' ? fr : enUS })}</td>
                    <td>{inv.expiresAt ? format(new Date(inv.expiresAt), 'MMM dd, yyyy', { locale: i18n.language === 'fr' ? fr : enUS }) : '—'}</td>
                    <td>{inv.usedBy?.username || '—'}</td>
                    <td>{inv.usedAt ? format(new Date(inv.usedAt), 'MMM dd, yyyy HH:mm', { locale: i18n.language === 'fr' ? fr : enUS }) : '—'}</td>
                    <td className="note-cell">{inv.note || '—'}</td>
                    <td>
                      {!inv.isUsed && (
                        <button
                          className="btn-revoke"
                          onClick={() => handleRevoke(inv.code)}
                          title={t('admin.revokeCode')}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
        </>
      )}

      {/* Tab Content: Users */}
      {activeTab === 'users' && (
        <UserManagement
          onError={(msg) => setError(msg)}
          onSuccess={(msg) => setSuccess(msg)}
        />
      )}

      {/* Global Messages for Users Tab */}
      {activeTab === 'users' && (error || success) && (
        <div className="global-messages">
          {error && <div className="message error-message">{error}</div>}
          {success && <div className="message success-message">{success}</div>}
        </div>
      )}
      </main>
    </div>
  )
}

export default AdminPanel