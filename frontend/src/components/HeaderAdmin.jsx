import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import './HeaderAdmin.css'

function HeaderAdmin() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [version, setVersion] = useState('')

  useEffect(() => {
    fetchVersion()
  }, [])

  const fetchVersion = async () => {
    try {
      const response = await axios.get('/api/version')
      setVersion(response.data.version)
    } catch (error) {
      console.error('Error fetching version:', error)
    }
  }

  return (
    <header className="header-admin">
      <div className="header-admin-content">
        <div className="header-left">
          <h1 className="logo terminal-text">SUBLY</h1>
          <div className="terminal-breadcrumb">
            <span className="terminal-prompt">root@subly{version ? `-${version}` : ''}:~$</span>
            <span className="cursor"></span>
          </div>
        </div>

        <div className="header-admin-actions">
          <button className="btn-back-dashboard" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={18} />
            {t('admin.dashboard')}
          </button>
        </div>
      </div>
    </header>
  )
}

export default HeaderAdmin