import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { useCurrency } from '../context/CurrencyContext'
import { getUploadUrl } from '../utils/api'
import { getBestLogoUrl } from '../config/serviceLogos'
import IconSearchModal from './IconSearchModal'
import './SubscriptionForm.css'

function SubscriptionForm({ onSubmit, onCancel, onDelete, initialData, categories }) {
  const { t } = useTranslation()
  const { formatAmount, currency } = useCurrency()
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    billingCycle: 'monthly',
    category: '',
    paymentMethod: '',
    nextBillingDate: format(new Date(), 'yyyy-MM-dd'),
    isActive: true,
    notes: '',
    url: '',
    iconUrl: '',
    iconFilename: '',
    isTrial: false,
    trialEndDate: '',
    isShared: false,
    totalPeople: 2,
    peopleWhoPaid: 1,
    shareNames: []
  })
  const [showNames, setShowNames] = useState(false)
  const [iconFile, setIconFile] = useState(null)
  const [iconPreview, setIconPreview] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadingIcon, setUploadingIcon] = useState(false)
  const [autoDetectedLogo, setAutoDetectedLogo] = useState(null)
  const [logoSource, setLogoSource] = useState(null) // 'google', 'local', or null
  const [useCustomLogo, setUseCustomLogo] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [showIconSearchModal, setShowIconSearchModal] = useState(false)

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        amount: initialData.amount,
        billingCycle: initialData.billingCycle,
        category: initialData.category || '',
        paymentMethod: initialData.paymentMethod || '',
        nextBillingDate: format(new Date(initialData.nextBillingDate), 'yyyy-MM-dd'),
        isActive: initialData.isActive,
        notes: initialData.notes || '',
        url: initialData.url || '',
        iconUrl: initialData.iconUrl || '',
        iconFilename: initialData.iconFilename || '',
        isTrial: initialData.isTrial || false,
        trialEndDate: initialData.trialEndDate ? format(new Date(initialData.trialEndDate), 'yyyy-MM-dd') : '',
        isShared: initialData.isShared || false,
        totalPeople: initialData.totalPeople || 2,
        peopleWhoPaid: initialData.peopleWhoPaid || 1,
        shareNames: initialData.shareNames || []
      })

      // Set preview if there's an existing icon
      if (initialData.iconFilename) {
        // User uploaded a custom file
        setIconPreview(getUploadUrl(initialData.iconFilename))
        setUseCustomLogo(true)
      } else if (initialData.iconUrl) {
        // Could be from Google Favicons or old data
        setIconPreview(initialData.iconUrl)
        // Check if it's a Google Favicons URL
        if (initialData.iconUrl.includes('google.com/s2/favicons')) {
          setAutoDetectedLogo(initialData.iconUrl)
          setLogoSource('google')
          setUseCustomLogo(false)
        } else {
          // Old custom URL, don't block auto-detection
          setUseCustomLogo(false)
        }
      }
    }

    // Mark initial load as complete (for both new and edit mode)
    setIsInitialLoad(false)
  }, [initialData])

  // Auto-detect logo when URL changes (but not on initial load to preserve existing logos)
  useEffect(() => {
    // Skip on initial load to preserve existing icon
    if (isInitialLoad) {
      return
    }

    if (!useCustomLogo) {
      // Get logo using Google Favicons from URL
      const { url, source } = getBestLogoUrl(formData.url)

      if (url) {
        setAutoDetectedLogo(url)
        setLogoSource(source)
        setIconPreview(url)
        // Store the URL in iconUrl field (not iconFilename since it's external)
        setFormData(prev => ({
          ...prev,
          iconFilename: '',
          iconUrl: url
        }))
      } else {
        setAutoDetectedLogo(null)
        setLogoSource(null)
        if (!iconFile && !formData.iconFilename) {
          setIconPreview(null)
          setFormData(prev => ({
            ...prev,
            iconUrl: ''
          }))
        }
      }
    }
  }, [formData.url, useCustomLogo, iconFile, formData.iconFilename, isInitialLoad])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    // If changing trial end date, also update next billing date
    if (name === 'trialEndDate' && value) {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        nextBillingDate: value
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError(t('subscription.iconInvalidType'))
      return
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError(t('subscription.iconTooLarge'))
      return
    }

    setIconFile(file)
    setUseCustomLogo(true) // Mark as using custom logo

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setIconPreview(reader.result)
    }
    reader.readAsDataURL(file)

    // Upload immediately
    await uploadIcon(file)
  }

  const uploadIcon = async (file) => {
    setUploadingIcon(true)
    setError('')

    try {
      const formDataUpload = new FormData()
      formDataUpload.append('icon', file)

      const response = await axios.post('/api/upload', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      // Update form data with the uploaded filename
      setFormData(prev => ({
        ...prev,
        iconFilename: response.data.filename,
        iconUrl: '' // Clear iconUrl when using uploaded file
      }))

      console.log('✅ Icon uploaded:', response.data.filename)
    } catch (err) {
      setError(err.response?.data?.message || t('subscription.iconUploadFailed'))
      setIconFile(null)
      setIconPreview(null)
    } finally {
      setUploadingIcon(false)
    }
  }

  const removeIcon = () => {
    setIconFile(null)
    setIconPreview(null)
    setUseCustomLogo(false) // Reset to auto-detection
    setFormData(prev => ({
      ...prev,
      iconFilename: '',
      iconUrl: ''
    }))
  }

  const handleIconSelect = (icon) => {
    // Set the selected icon from dashboard-icons
    setIconPreview(icon.url)
    setUseCustomLogo(true) // Mark as using custom icon
    setLogoSource('dashboard-icons')
    setFormData(prev => ({
      ...prev,
      iconUrl: icon.url,
      iconFilename: '' // Clear any uploaded file
    }))
    console.log('✅ Icon selected from dashboard-icons:', icon.name)
  }

  const toggleCustomLogo = () => {
    if (useCustomLogo) {
      // Switching back to auto-detect
      setUseCustomLogo(false)
      setIconFile(null)
      setFormData(prev => ({
        ...prev,
        iconFilename: '',
        iconUrl: ''
      }))
      // This will trigger the auto-detect useEffect
    } else {
      // Switching to custom logo
      setUseCustomLogo(true)
      setAutoDetectedLogo(null)
    }
  }

  const updatePersonName = (index, name) => {
    const newShareNames = [...formData.shareNames]
    newShareNames[index] = name
    setFormData(prev => ({
      ...prev,
      shareNames: newShareNames
    }))
  }

  const handleCategoryChange = (e) => {
    const value = e.target.value
    if (value === '__new__') {
      setShowNewCategoryInput(true)
      setNewCategoryName('')
    } else {
      setFormData(prev => ({ ...prev, category: value }))
      setShowNewCategoryInput(false)
    }
  }

  const createNewCategory = async () => {
    if (!newCategoryName.trim()) {
      setError(t('subscription.categoryNameRequired') || 'Category name is required')
      return
    }

    setCreatingCategory(true)
    setError('')

    try {
      const response = await axios.post('/api/categories', {
        name: newCategoryName.trim()
      })

      // Add the new category to the form and trigger a refresh
      setFormData(prev => ({ ...prev, category: response.data.name }))
      setShowNewCategoryInput(false)
      setNewCategoryName('')

      // Trigger parent component to reload categories
      if (window.reloadCategories) {
        await window.reloadCategories()
      }
    } catch (err) {
      setError(err.response?.data?.message || t('subscription.categoryCreateFailed') || 'Failed to create category')
    } finally {
      setCreatingCategory(false)
    }
  }

  const cancelNewCategory = () => {
    setShowNewCategoryInput(false)
    setNewCategoryName('')
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Convert empty strings to null for optional fields
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod || null,
        category: formData.category || null,
        trialEndDate: formData.trialEndDate || null
      }

      await onSubmit(submitData)
    } catch (err) {
      setError(err.response?.data?.message || t('subscription.saveFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-container glow">
      <div className="form-header">
        <h2 className="terminal-text">
          <span className="terminal-prompt">&gt;</span>{' '}
          {initialData ? t('subscription.editTitle') : t('subscription.newTitle')}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="subscription-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="name">
              <span className="terminal-prompt">&gt;</span> {t('subscription.name').toUpperCase()} *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder={t('subscription.namePlaceholder')}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="amount">
              <span className="terminal-prompt">&gt;</span> {t('subscription.amount').toUpperCase()} *
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={handleChange}
              required
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="billingCycle">
              <span className="terminal-prompt">&gt;</span> {t('subscription.billingCycle').toUpperCase()} *
            </label>
            <select
              id="billingCycle"
              name="billingCycle"
              value={formData.billingCycle}
              onChange={handleChange}
              required
            >
              <option value="monthly">{t('subscription.monthly')}</option>
              <option value="annual">{t('subscription.annual')}</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="category">
              <span className="terminal-prompt">&gt;</span> {t('subscription.category').toUpperCase()}
            </label>
            {!showNewCategoryInput ? (
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleCategoryChange}
              >
                <option value="">{t('subscription.selectCategory')}</option>
                {categories && categories.map(cat => (
                  <option key={cat._id} value={cat.name}>{cat.name}</option>
                ))}
                <option value="__new__" style={{ fontStyle: 'italic', borderTop: '1px solid var(--terminal-green)' }}>
                  + {t('subscription.createNewCategory') || '+ Create new category...'}
                </option>
              </select>
            ) : (
              <div className="new-category-input-group">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder={t('subscription.newCategoryName') || 'New category name'}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      createNewCategory()
                    } else if (e.key === 'Escape') {
                      cancelNewCategory()
                    }
                  }}
                />
                <div className="new-category-actions">
                  <button
                    type="button"
                    onClick={createNewCategory}
                    disabled={creatingCategory}
                    className="btn-confirm-category"
                  >
                    {creatingCategory ? '...' : '✓'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelNewCategory}
                    className="btn-cancel-category"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="nextBillingDate">
              <span className="terminal-prompt">&gt;</span> {t('subscription.nextBilling').toUpperCase()} *
            </label>
            <input
              id="nextBillingDate"
              name="nextBillingDate"
              type="date"
              value={formData.nextBillingDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group checkbox-group">
            <label>
              <span className="terminal-prompt">&gt;</span> {t('subscription.status').toUpperCase()}
            </label>
            <label htmlFor="isActive" className="checkbox-inline">
              <input
                id="isActive"
                name="isActive"
                type="checkbox"
                checked={formData.isActive}
                onChange={handleChange}
              />
              <span>{t('subscription.active').toUpperCase()}</span>
            </label>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group checkbox-group">
            <label>
              <span className="terminal-prompt">&gt;</span> {t('subscription.freeTrial').toUpperCase()}
            </label>
            <label htmlFor="isTrial" className="checkbox-inline">
              <input
                id="isTrial"
                name="isTrial"
                type="checkbox"
                checked={formData.isTrial}
                onChange={handleChange}
              />
              <span>{t('subscription.freeTrial').toUpperCase()}</span>
            </label>
          </div>

          {formData.isTrial && (
            <div className="form-group">
              <label htmlFor="trialEndDate">
                <span className="terminal-prompt">&gt;</span> {t('subscription.trialEndDate').toUpperCase()} *
              </label>
              <input
                id="trialEndDate"
                name="trialEndDate"
                type="date"
                value={formData.trialEndDate}
                onChange={handleChange}
                required={formData.isTrial}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="paymentMethod">
              <span className="terminal-prompt">&gt;</span> {t('subscription.paymentMethod').toUpperCase()}
            </label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
            >
              <option value="">{t('subscription.selectPaymentMethod')}</option>
              <option value="card">{t('paymentMethods.card')}</option>
              <option value="paypal">{t('paymentMethods.paypal')}</option>
              <option value="crypto">{t('paymentMethods.crypto')}</option>
              <option value="bank">{t('paymentMethods.bank')}</option>
              <option value="paysafecard">{t('paymentMethods.paysafecard')}</option>
              <option value="revolut">{t('paymentMethods.revolut')}</option>
            </select>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <span className="terminal-prompt">&gt;</span> {t('subscription.shared').toUpperCase()}
            </label>
            <label htmlFor="isShared" className="checkbox-inline">
              <input
                id="isShared"
                name="isShared"
                type="checkbox"
                checked={formData.isShared}
                onChange={handleChange}
              />
              <span>{t('subscription.sharedWith').toUpperCase()}</span>
            </label>
          </div>
        </div>

        {formData.isShared && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="totalPeople">
                  <span className="terminal-prompt">&gt;</span> {t('subscription.totalPeople').toUpperCase()}
                </label>
                <select
                  id="totalPeople"
                  name="totalPeople"
                  value={formData.totalPeople}
                  onChange={handleChange}
                >
                  {[2, 3, 4, 5, 6, 7, 8].map(num => (
                    <option key={num} value={num}>
                      {num} {t('common.people')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="peopleWhoPaid">
                  <span className="terminal-prompt">&gt;</span> {t('subscription.iPay').toUpperCase()}
                </label>
                <select
                  id="peopleWhoPaid"
                  name="peopleWhoPaid"
                  value={formData.peopleWhoPaid}
                  onChange={handleChange}
                >
                  {Array.from({ length: formData.totalPeople }, (_, i) => i + 1).map(num => {
                    const shareAmount = formData.amount ? ((parseFloat(formData.amount) / formData.totalPeople) * num) : 0
                    return (
                      <option key={num} value={num}>
                        {num} {num === 1 ? t('common.share') : t('common.shares')}
                        {formData.amount && ` (${formatAmount(shareAmount)})`}
                      </option>
                    )
                  })}
                </select>
              </div>
            </div>

            <div className="form-group">
              <button
                type="button"
                onClick={() => setShowNames(!showNames)}
                className="btn-toggle-names"
              >
                {showNames ? '▼' : '▶'} {t('subscription.nameThePeople')} ({t('common.optional')})
              </button>

              {showNames && (
                <div className="people-names">
                  {Array.from({ length: formData.totalPeople }).map((_, index) => (
                    <div key={index} className="name-input-row">
                      <span className="person-number">{t('common.person')} {index + 1}:</span>
                      <input
                        type="text"
                        placeholder={t('subscription.personName')}
                        value={formData.shareNames[index] || ''}
                        onChange={(e) => updatePersonName(index, e.target.value)}
                      />
                      {index < formData.peopleWhoPaid && (
                        <span className="paid-by-you-badge">✓ {t('subscription.paidByYou')}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="share-summary-card">
              <div className="summary-row">
                <span>{t('subscription.totalCost')}:</span>
                <span className="amount">{formData.amount ? formatAmount(parseFloat(formData.amount)) : '0.00'}</span>
              </div>
              <div className="summary-row">
                <span>{t('subscription.costPerPerson')}:</span>
                <span className="amount">
                  {formData.amount ? formatAmount(parseFloat(formData.amount) / formData.totalPeople) : '0.00'}
                </span>
              </div>
              <div className="summary-row highlight">
                <span>{t('subscription.youPay')}:</span>
                <span className="amount-highlight">
                  {formData.amount ? formatAmount((parseFloat(formData.amount) / formData.totalPeople) * formData.peopleWhoPaid) : '0.00'}
                </span>
              </div>
            </div>
          </>
        )}

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="url">
              <span className="terminal-prompt">&gt;</span> {t('subscription.serviceUrl').toUpperCase()}
            </label>
            <input
              id="url"
              name="url"
              type="url"
              value={formData.url}
              onChange={handleChange}
              placeholder="https://example.com"
            />
            {!iconPreview && !formData.url && (
              <div className="field-hint">
                💡 {t('subscription.urlHint') || 'Enter the service URL to automatically detect the logo'}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>
              <span className="terminal-prompt">&gt;</span> {t('subscription.icon').toUpperCase()}
            </label>

            {/* Auto-detected logo badge */}
            {autoDetectedLogo && !useCustomLogo && logoSource === 'google' && (
              <div className="logo-badge auto-detected">
                <span className="badge-icon">✓</span>
                <span>{t('subscription.logoFromUrl') || 'Logo from URL'}</span>
              </div>
            )}

            {/* Custom logo toggle */}
            {autoDetectedLogo && !useCustomLogo && (
              <button
                type="button"
                onClick={toggleCustomLogo}
                className="btn-toggle-custom"
              >
                {t('subscription.useCustomLogo') || 'Use custom logo instead'}
              </button>
            )}

            {/* Show file input only if no logo preview OR user wants to upload */}
            {!iconPreview && (
              <div className="icon-upload-section">
                <div className="file-input-wrapper">
                  <input
                    id="iconFile"
                    name="iconFile"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/svg+xml,image/webp"
                    onChange={handleFileChange}
                    disabled={uploadingIcon}
                  />
                  <label
                    htmlFor="iconFile"
                    className={`file-input-label ${uploadingIcon ? 'disabled' : ''}`}
                  >
                    <span className="terminal-prompt">&gt;</span> {t('subscription.chooseFile').toUpperCase()}
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIconSearchModal(true)}
                  className="btn-search-icon"
                  disabled={uploadingIcon}
                >
                  <span className="terminal-prompt">&gt;</span> {(t('subscription.searchIcon') || 'SEARCH ICON').toUpperCase()}
                </button>
              </div>
            )}
            {uploadingIcon && <div className="upload-status">{t('subscription.uploading')}</div>}

            {iconPreview && (
              <div className="icon-preview">
                <img src={iconPreview} alt={t('subscription.iconPreview')} />
                {useCustomLogo && logoSource === 'dashboard-icons' && (
                  <div className="logo-badge dashboard-icons">
                    <span className="badge-icon">🔍</span>
                    <span>{t('subscription.dashboardIcon') || 'Dashboard icon'}</span>
                  </div>
                )}
                {useCustomLogo && !logoSource && (
                  <div className="logo-badge custom">
                    <span className="badge-icon">⚙</span>
                    <span>{t('subscription.customLogo') || 'Custom logo'}</span>
                  </div>
                )}
                <button type="button" onClick={removeIcon} className="btn-remove-icon">
                  ✕
                </button>
              </div>
            )}

            {/* Show switch button if user has custom logo but URL is available */}
            {useCustomLogo && formData.url && (
              <button
                type="button"
                onClick={toggleCustomLogo}
                className="btn-toggle-custom"
                style={{ marginTop: '10px' }}
              >
                {t('subscription.switchToAutoLogo') || 'Switch to automatic logo from URL'}
              </button>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="notes">
            <span className="terminal-prompt">&gt;</span> {t('subscription.notes').toUpperCase()}
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            placeholder={t('subscription.notesPlaceholder')}
          />
        </div>

        {error && (
          <div className="error-message">
            <span className="terminal-prompt">{t('common.error').toUpperCase()}:</span> {error}
          </div>
        )}

        <div className="form-actions">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? t('subscription.saving').toUpperCase() : initialData ? t('subscription.update').toUpperCase() : t('subscription.create').toUpperCase()}
          </button>
          {initialData && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(initialData._id)}
              className="btn-danger"
            >
              {t('subscription.delete').toUpperCase()}
            </button>
          )}
        </div>
      </form>

      {/* Icon Search Modal */}
      <IconSearchModal
        isOpen={showIconSearchModal}
        onClose={() => setShowIconSearchModal(false)}
        onSelectIcon={handleIconSelect}
        initialSearch={formData.name}
      />
    </div>
  )
}

export default SubscriptionForm