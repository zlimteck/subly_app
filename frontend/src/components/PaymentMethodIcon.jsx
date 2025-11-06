import './PaymentMethodIcon.css'

function PaymentMethodIcon({ method, size = 20 }) {
  if (!method) return null

  const icons = {
    card: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
        <line x1="2" y1="10" x2="22" y2="10" stroke="currentColor" strokeWidth="2"/>
        <line x1="5" y1="15" x2="9" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    paypal: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 4h6c3 0 5 2 5 5s-2 5-5 5h-3l-1 5h-2l3-15z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M11 10h-1l-1 5h-2l1-5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      </svg>
    ),
    crypto: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
        <path d="M9 8h4c1.5 0 2.5 1 2.5 2.5S14.5 13 13 13H9V8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M9 13h4c1.5 0 2.5 1 2.5 2.5S14.5 18 13 18H9v-5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        <line x1="12" y1="6" x2="12" y2="8" stroke="currentColor" strokeWidth="2"/>
        <line x1="12" y1="18" x2="12" y2="20" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    bank: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 10l9-7 9 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="5" y1="10" x2="5" y2="19" stroke="currentColor" strokeWidth="2"/>
        <line x1="9" y1="10" x2="9" y2="19" stroke="currentColor" strokeWidth="2"/>
        <line x1="15" y1="10" x2="15" y2="19" stroke="currentColor" strokeWidth="2"/>
        <line x1="19" y1="10" x2="19" y2="19" stroke="currentColor" strokeWidth="2"/>
        <line x1="2" y1="19" x2="22" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="2" y1="21" x2="22" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    paysafecard: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="7" width="18" height="10" rx="1" stroke="currentColor" strokeWidth="2"/>
        <circle cx="8" cy="12" r="1.5" fill="currentColor"/>
        <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
        <circle cx="16" cy="12" r="1.5" fill="currentColor"/>
      </svg>
    ),
    revolut: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 6h6c2 0 3 1 3 3s-1 3-3 3H7V6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        <line x1="7" y1="12" x2="7" y2="18" stroke="currentColor" strokeWidth="2"/>
        <path d="M13 12l4 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    )
  }

  return (
    <div className="payment-method-icon" title={method}>
      {icons[method] || null}
    </div>
  )
}

export default PaymentMethodIcon