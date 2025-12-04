import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import './IconSearchModal.css'

const ICONS_METADATA_URL = 'https://raw.githubusercontent.com/homarr-labs/dashboard-icons/main/metadata.json'
const ICON_CDN_BASE = 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg'

function IconSearchModal({ isOpen, onClose, onSelectIcon, initialSearch = '' }) {
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const [iconsData, setIconsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load icons metadata on mount
  useEffect(() => {
    if (isOpen && !iconsData) {
      fetchIconsMetadata()
    }
  }, [isOpen, iconsData])

  // Set initial search term when modal opens
  useEffect(() => {
    if (isOpen && initialSearch) {
      setSearchTerm(initialSearch)
    } else if (!isOpen) {
      // Reset search when modal closes
      setSearchTerm('')
    }
  }, [isOpen, initialSearch])

  const fetchIconsMetadata = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(ICONS_METADATA_URL)
      if (!response.ok) throw new Error('Failed to fetch icons')
      const data = await response.json()
      setIconsData(data)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching icons:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filter and search icons
  const filteredIcons = useMemo(() => {
    if (!iconsData) return []

    const icons = Object.entries(iconsData).map(([id, metadata]) => ({
      id,
      name: id,
      aliases: metadata.aliases || [],
      categories: metadata.categories || [],
      url: `${ICON_CDN_BASE}/${id}.svg`
    }))

    if (!searchTerm.trim()) {
      return icons.slice(0, 100) // Show first 100 icons by default
    }

    const search = searchTerm.toLowerCase()
    return icons
      .filter(icon => {
        const nameMatch = icon.name.toLowerCase().includes(search)
        const aliasMatch = icon.aliases.some(alias =>
          alias.toLowerCase().includes(search)
        )
        const categoryMatch = icon.categories.some(cat =>
          cat.toLowerCase().includes(search)
        )
        return nameMatch || aliasMatch || categoryMatch
      })
      .slice(0, 100) // Limit results
  }, [iconsData, searchTerm])

  const handleIconClick = (icon) => {
    onSelectIcon({
      url: icon.url,
      name: icon.name,
      source: 'dashboard-icons'
    })
    onClose()
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div className="icon-modal-overlay" onClick={handleOverlayClick}>
      <div className="icon-modal">
        <div className="icon-modal-header">
          <h3>
            <span className="terminal-prompt">&gt;</span> {t('subscription.searchIcon') || 'SEARCH ICON'}
          </h3>
          <button
            className="icon-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="icon-modal-search">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('subscription.searchIconPlaceholder') || 'Search by name, alias, or category...'}
            autoFocus
          />
        </div>

        <div className="icon-modal-body">
          {loading && (
            <div className="icon-modal-loading">
              <div className="loading-spinner"></div>
              <p>{t('subscription.loadingIcons') || 'Loading icons...'}</p>
            </div>
          )}

          {error && (
            <div className="icon-modal-error">
              <p>❌ {error}</p>
              <button onClick={fetchIconsMetadata} className="btn-retry">
                {t('subscription.retry') || 'Retry'}
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="icon-modal-info">
                <span className="terminal-prompt">&gt;</span>
                {filteredIcons.length} {t('subscription.iconsFound') || 'icons found'}
              </div>
              <div className="icon-grid">
                {filteredIcons.map((icon) => (
                  <button
                    key={icon.id}
                    className="icon-item"
                    onClick={() => handleIconClick(icon)}
                    title={icon.name}
                  >
                    <img
                      src={icon.url}
                      alt={icon.name}
                      loading="lazy"
                      onError={(e) => {
                        // Cache l'icône si elle ne charge pas
                        e.target.parentElement.style.display = 'none'
                      }}
                    />
                    <span className="icon-name">{icon.name}</span>
                  </button>
                ))}
              </div>
              {filteredIcons.length === 0 && (
                <div className="icon-modal-empty">
                  <p>{t('subscription.noIconsFound') || 'No icons found'}</p>
                  <p className="empty-hint">
                    {t('subscription.tryDifferentSearch') || 'Try a different search term'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default IconSearchModal