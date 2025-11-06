import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import './ScrollToTop.css'

function ScrollToTop() {
  const { t } = useTranslation()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility)

    return () => {
      window.removeEventListener('scroll', toggleVisibility)
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return (
    <button
      className={`scroll-to-top ${isVisible ? 'visible' : ''}`}
      onClick={scrollToTop}
      title={t('common.scrollToTop')}
      aria-label={t('common.scrollToTop')}
    >
      ↑
    </button>
  )
}

export default ScrollToTop
