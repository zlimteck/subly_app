import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

function Login() {
  const { t } = useTranslation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsRateLimited(false)
    setLoading(true)

    try {
      await login(username, password)
      navigate('/dashboard')
    } catch (err) {
      // Handle different error response formats
      const errorMessage = err.response?.data?.message ||
                          err.response?.data?.errors?.[0]?.msg ||
                          err.message ||
                          t('auth.loginError')

      // Check if it's a rate limit error
      if (err.response?.status === 429) {
        setIsRateLimited(true)
        setError(`⏱️ ${t('auth.rateLimitError')}`)
      } else {
        setIsRateLimited(false)
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
        <p className="auth-subtitle">{t('app.tagline')}</p>

        <form onSubmit={handleSubmit} className="auth-form">
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
              placeholder={t('auth.usernamePlaceholder')}
              autoFocus
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
              placeholder={t('auth.passwordPlaceholder')}
            />
          </div>

          {error && (
            <div className={`error-message ${isRateLimited ? 'rate-limit-warning' : ''}`}>
              <span className="terminal-prompt">{isRateLimited ? t('auth.rateLimit').toUpperCase() + ':' : t('common.error').toUpperCase() + ':'}</span> {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? t('auth.authenticating').toUpperCase() : t('auth.login').toUpperCase()}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            <span className="terminal-prompt">&gt;</span> {t('auth.noAccount')} {' '}
            <Link to="/register" className="link">{t('auth.createAccount')}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login