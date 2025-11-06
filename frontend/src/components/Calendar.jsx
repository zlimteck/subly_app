import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCurrency } from '../context/CurrencyContext'
import { getUploadUrl } from '../utils/api'
import './Calendar.css'

function Calendar({ subscriptions }) {
  const { t, i18n } = useTranslation()
  const [currentDate, setCurrentDate] = useState(new Date())
  const { formatAmount } = useCurrency()

  // Get the first and last day of the month
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)

  // Get the start and end of the calendar view (including days from previous/next month)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)

  // Get all days to display
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // Group subscriptions by date
  const getSubscriptionsForDay = (day) => {
    return subscriptions.filter(sub => {
      const billingDate = new Date(sub.nextBillingDate)
      return isSameDay(billingDate, day) && sub.isActive
    })
  }

  // Calculate total for the month
  const getMonthTotal = () => {
    return subscriptions
      .filter(sub => {
        const billingDate = new Date(sub.nextBillingDate)
        return isSameMonth(billingDate, currentDate) && sub.isActive
      })
      .reduce((total, sub) => total + sub.amount, 0)
  }

  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const weekDays = [
    t('calendar.weekdays.mon').toUpperCase(),
    t('calendar.weekdays.tue').toUpperCase(),
    t('calendar.weekdays.wed').toUpperCase(),
    t('calendar.weekdays.thu').toUpperCase(),
    t('calendar.weekdays.fri').toUpperCase(),
    t('calendar.weekdays.sat').toUpperCase(),
    t('calendar.weekdays.sun').toUpperCase()
  ]

  return (
    <div className="calendar-section">
      <div className="calendar-header">
        <h2 className="section-title">
          <span className="terminal-prompt">&gt;</span> {t('calendar.title').toUpperCase()}
        </h2>
        <div className="calendar-controls">
          <button onClick={goToPreviousMonth} className="btn-icon" title={t('calendar.previousMonth')}>
            <ChevronLeft size={20} />
          </button>
          <button onClick={goToToday} className="btn-today">
            {t('calendar.today').toUpperCase()}
          </button>
          <button onClick={goToNextMonth} className="btn-icon" title={t('calendar.nextMonth')}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="calendar-info">
        <div className="calendar-month">{format(currentDate, 'MMMM yyyy', { locale: i18n.language === 'fr' ? fr : enUS })}</div>
        <div className="calendar-total">
          <span className="terminal-prompt">&gt;</span> {t('calendar.monthlyTotal')}: {formatAmount(getMonthTotal())}
        </div>
      </div>

      <div className="calendar-container glow">
        <div className="calendar-weekdays">
          {weekDays.map(day => (
            <div key={day} className="calendar-weekday">
              {day}
            </div>
          ))}
        </div>

        <div className="calendar-grid">
          {calendarDays.map((day, index) => {
            const daySubscriptions = getSubscriptionsForDay(day)
            const isToday = isSameDay(day, new Date())
            const isCurrentMonth = isSameMonth(day, currentDate)
            const dayTotal = daySubscriptions.reduce((sum, sub) => sum + sub.amount, 0)

            return (
              <div
                key={index}
                className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${daySubscriptions.length > 0 ? 'has-subscriptions' : ''}`}
              >
                <div className="day-number">{format(day, 'd')}</div>
                {daySubscriptions.length > 0 && (
                  <div className="day-subscriptions">
                    {daySubscriptions.map(sub => (
                      <div key={sub._id} className="day-subscription" title={`${sub.name}: ${formatAmount(sub.amount)}`}>
                        {sub.iconFilename && (
                          <img src={getUploadUrl(sub.iconFilename)} alt={sub.name} className="day-sub-icon" />
                        )}
                        {!sub.iconFilename && sub.iconUrl && (
                          <img src={sub.iconUrl} alt={sub.name} className="day-sub-icon" />
                        )}
                        {!sub.iconFilename && !sub.iconUrl && (
                          <span className="day-sub-name">{sub.name.charAt(0)}</span>
                        )}
                      </div>
                    ))}
                    {daySubscriptions.length > 3 && (
                      <div className="day-more">+{daySubscriptions.length - 3}</div>
                    )}
                    <div className="day-total">{formatAmount(dayTotal)}</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Calendar