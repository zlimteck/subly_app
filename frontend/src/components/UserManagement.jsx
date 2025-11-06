import { useState, useEffect } from 'react'
import axios from 'axios'
import { useCurrency } from '../context/CurrencyContext'
import { Search, X, Trash2, RotateCcw, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'
import './UserManagement.css'

function UserManagement({ onError, onSuccess }) {
  const { formatAmount } = useCurrency()
  const { t, i18n } = useTranslation()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({})
  const [includeDeleted, setIncludeDeleted] = useState(false)

  // Modal states
  const [showSoftDeleteModal, setShowSoftDeleteModal] = useState(false)
  const [showHardDeleteModal, setShowHardDeleteModal] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [confirmUsername, setConfirmUsername] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [page, search, includeDeleted])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/admin/users', {
        params: {
          page,
          limit: 20,
          search,
          includeDeleted
        }
      })
      setUsers(response.data.users)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error('Error fetching users:', error)
      onError?.(t('admin.errorLoadUsers'))
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value) => {
    setSearch(value)
    setPage(1)
  }

  const openSoftDeleteModal = (user) => {
    setSelectedUser(user)
    setShowSoftDeleteModal(true)
  }

  const openHardDeleteModal = (user) => {
    setSelectedUser(user)
    setConfirmUsername('')
    setShowHardDeleteModal(true)
  }

  const openRestoreModal = (user) => {
    setSelectedUser(user)
    setShowRestoreModal(true)
  }

  const handleSoftDelete = async () => {
    try {
      await axios.put(`/api/admin/users/${selectedUser._id}/soft-delete`)
      setShowSoftDeleteModal(false)
      setSelectedUser(null)
      onSuccess?.(t('admin.userDeactivated', { username: selectedUser.username }))
      fetchUsers()
    } catch (error) {
      console.error('Error soft deleting user:', error)
      onError?.(error.response?.data?.message || t('admin.errorDeactivateUser'))
    }
  }

  const handleHardDelete = async () => {
    if (confirmUsername !== selectedUser.username) {
      onError?.(t('admin.usernameDoesNotMatch'))
      return
    }

    try {
      await axios.delete(`/api/admin/users/${selectedUser._id}`)
      setShowHardDeleteModal(false)
      setSelectedUser(null)
      setConfirmUsername('')
      onSuccess?.(t('admin.userDeleted', { username: selectedUser.username }))
      fetchUsers()
    } catch (error) {
      console.error('Error hard deleting user:', error)
      onError?.(error.response?.data?.message || t('admin.errorDeleteUser'))
    }
  }

  const handleRestore = async () => {
    try {
      await axios.put(`/api/admin/users/${selectedUser._id}/restore`)
      setShowRestoreModal(false)
      setSelectedUser(null)
      onSuccess?.(t('admin.userRestored', { username: selectedUser.username }))
      fetchUsers()
    } catch (error) {
      console.error('Error restoring user:', error)
      onError?.(error.response?.data?.message || t('admin.errorRestoreUser'))
    }
  }

  return (
    <div className="user-management">
      {/* Search and Filters */}
      <div className="user-search-filters">
        <div className="user-search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder={t('admin.searchPlaceholder')}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input"
          />
          {search && (
            <button onClick={() => handleSearch('')} className="clear-search" title={t('admin.clearSearch')}>
              <X size={16} />
            </button>
          )}
        </div>

        <label className="checkbox-filter">
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={(e) => {
              setIncludeDeleted(e.target.checked)
              setPage(1)
            }}
          />
          <span>{t('admin.showDeletedUsers')}</span>
        </label>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="loading-state">{t('admin.loadingUsers')}</div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <p className="terminal-prompt">&gt; {t('admin.noUsersFound')}</p>
        </div>
      ) : (
        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>{t('admin.username')}</th>
                <th>{t('admin.email')}</th>
                <th>{t('admin.role')}</th>
                <th>{t('admin.subs')}</th>
                <th>{t('admin.joined')}</th>
                <th>{t('admin.status')}</th>
                <th>{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className={u.isDeleted ? 'deleted-user' : ''}>
                  <td className="username-cell">{u.username}</td>
                  <td className="email-cell">{u.email || '—'}</td>
                  <td>
                    <span className={`role-badge ${u.role}`}>{u.role.toUpperCase()}</span>
                  </td>
                  <td className="center">{u.subscriptionCount}</td>
                  <td>{format(new Date(u.createdAt), 'MMM dd, yyyy', { locale: i18n.language === 'fr' ? fr : enUS })}</td>
                  <td>
                    {u.isDeleted ? (
                      <span className="status-badge deleted">{t('admin.statusDeleted')}</span>
                    ) : (
                      <span className="status-badge active">{t('admin.statusActive')}</span>
                    )}
                  </td>
                  <td className="actions-cell">
                    {u.isDeleted ? (
                      <button
                        onClick={() => openRestoreModal(u)}
                        className="btn-action btn-restore"
                        title={t('admin.restoreUser')}
                      >
                        <RotateCcw size={16} />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => openSoftDeleteModal(u)}
                          className="btn-action btn-soft-delete"
                          title={t('admin.deactivateUser')}
                        >
                          <AlertTriangle size={16} />
                        </button>
                        <button
                          onClick={() => openHardDeleteModal(u)}
                          className="btn-action btn-hard-delete"
                          title={t('admin.deletePermanently')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="btn-page"
          >
            {t('admin.previous')}
          </button>
          <span className="page-info">
            {t('admin.pageInfo', { page, pages: pagination.pages, total: pagination.total })}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === pagination.pages}
            className="btn-page"
          >
            {t('admin.next')}
          </button>
        </div>
      )}

      {/* Modals */}
      {showSoftDeleteModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowSoftDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>
              <span className="terminal-prompt">&gt;</span> {t('admin.deactivateUserTitle')}
            </h3>
            <p>
              {t('admin.deactivateUserConfirm', { username: selectedUser.username })}
            </p>
            <p className="modal-note">
              {t('admin.deactivateUserNote')}
            </p>
            <div className="modal-actions">
              <button onClick={() => setShowSoftDeleteModal(false)} className="btn-secondary">
                {t('admin.cancel')}
              </button>
              <button onClick={handleSoftDelete} className="btn-warning">
                {t('admin.deactivate')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showHardDeleteModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowHardDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="danger">
              <span className="terminal-prompt">&gt;</span> {t('admin.deleteUserTitle')}
            </h3>
            <p>
              {t('admin.deleteUserWarning', { username: selectedUser.username })}
            </p>
            <p className="modal-warning">{t('admin.deleteUserCannotUndo')}</p>
            <p>{t('admin.deleteUserTypeToConfirm', { username: selectedUser.username })}</p>
            <input
              type="text"
              value={confirmUsername}
              onChange={(e) => setConfirmUsername(e.target.value)}
              placeholder={t('admin.deleteUserPlaceholder')}
              className="confirm-input"
              autoFocus
            />
            <div className="modal-actions">
              <button onClick={() => setShowHardDeleteModal(false)} className="btn-secondary">
                {t('admin.cancel')}
              </button>
              <button
                onClick={handleHardDelete}
                className="btn-danger"
                disabled={confirmUsername !== selectedUser.username}
              >
                {t('admin.deletePermanentlyButton')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRestoreModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowRestoreModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>
              <span className="terminal-prompt">&gt;</span> {t('admin.restoreUserTitle')}
            </h3>
            <p>
              {t('admin.restoreUserConfirm', { username: selectedUser.username })}
            </p>
            <p className="modal-note">{t('admin.restoreUserNote')}</p>
            <div className="modal-actions">
              <button onClick={() => setShowRestoreModal(false)} className="btn-secondary">
                {t('admin.cancel')}
              </button>
              <button onClick={handleRestore} className="btn-primary">
                {t('admin.restore')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement