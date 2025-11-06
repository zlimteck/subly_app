import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

function Register() {
  const { t } = useTranslation()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [invitationCode, setInvitationCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { register } = useAuth()

  const getPasswordStrength = (pass) => {
    if (pass.length < 12) return { strength: 'weak', text: t('auth.passwordTooShort') }

    const hasLower = /[a-z]/.test(pass)
    const hasUpper = /[A-Z]/.test(pass)
    const hasNumber = /\d/.test(pass)
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass)

    const criteriaCount = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length

    if (!hasLower || !hasUpper || !hasNumber) {
      return { strength: 'weak', text: t('auth.passwordNeedsCriteria') }
    }

    if (criteriaCount === 3) return { strength: 'medium', text: t('auth.passwordMedium') }
    if (criteriaCount === 4 && pass.length >= 16) return { strength: 'strong', text: t('auth.passwordStrong') }
    return { strength: 'medium', text: t('auth.passwordGood') }
  }

  const passwordStrength = password ? getPasswordStrength(password) : null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'))
      return
    }

    if (password.length < 12) {
      setError(t('auth.passwordMinLength'))
      return
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setError(t('auth.passwordRequirements'))
      return
    }

    setLoading(true)

    try {
      await register(username, password, invitationCode, email)
      navigate('/dashboard')
    } catch (err) {
      // Handle different error response formats
      const errorMessage = err.response?.data?.message ||
                          err.response?.data?.errors?.[0]?.msg ||
                          err.message ||
                          t('auth.registerError')

      // Check if it's a rate limit error
      if (err.response?.status === 429) {
        setError(`⏱️ ${t('auth.rateLimitRegister')}`)
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-box glow">
        <div className="terminal-header">
          <span className="terminal-prompt">root@subly:~$</span>
          <span className="cursor"></span>
        </div>

        <h1 className="auth-title terminal-text">SUBLY</h1>
        <p className="auth-subtitle">{t('auth.createNewAccount')}</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="invitationCode">
              <span className="terminal-prompt">&gt;</span> {t('auth.invitationCode').toUpperCase()}
            </label>
            <input
              id="invitationCode"
              type="text"
              value={invitationCode}
              onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
              required
              placeholder={t('auth.invitationCodePlaceholder')}
              autoFocus
              style={{ textTransform: 'uppercase' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">
              <span className="terminal-prompt">&gt;</span> {t('auth.username').toUpperCase()}
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              placeholder={t('auth.usernamePlaceholder')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">
              <span className="terminal-prompt">&gt;</span> {t('auth.email').toUpperCase()}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={t('auth.emailPlaceholder')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <span className="terminal-prompt">&gt;</span> {t('auth.password').toUpperCase()}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={12}
              placeholder={t('auth.passwordPlaceholderLong')}
            />
            {passwordStrength && (
              <div className={`password-strength ${passwordStrength.strength}`}>
                <div className="strength-bar">
                  <div className={`strength-fill strength-${passwordStrength.strength}`}></div>
                </div>
                <span className="strength-text">{passwordStrength.text}</span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              <span className="terminal-prompt">&gt;</span> {t('auth.confirmPassword').toUpperCase()}
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder={t('auth.confirmPasswordPlaceholder')}
            />
          </div>

          {error && (
            <div className="error-message">
              <span className="terminal-prompt">{t('common.error').toUpperCase()}:</span> {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? t('auth.creatingAccount').toUpperCase() : t('auth.register').toUpperCase()}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            <span className="terminal-prompt">&gt;</span> {t('auth.hasAccount')} {' '}
            <Link to="/login" className="link">{t('auth.login')}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register