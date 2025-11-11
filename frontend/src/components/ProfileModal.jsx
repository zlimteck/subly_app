import { useState, useEffect } from 'react';
import { X, Download, Lock, User, Calendar, Sun, Moon, Mail, CheckCircle, AlertCircle, Shield, Send, Bell, Palette, Languages, DollarSign, Copy, Link } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { isPushSupported, getNotificationPermission, requestNotificationPermission, subscribeToPush, unsubscribeFromPush, checkSubscriptionStatus } from '../utils/pushNotifications';
import './ProfileModal.css';

const ProfileModal = ({ isOpen, onClose, user, subscriptions }) => {
  const { getCurrencySymbol } = useCurrency();
  const { theme, setTheme } = useTheme();
  const { refreshUser } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [emailData, setEmailData] = useState({
    email: user?.email || ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(user?.emailNotifications ?? true);
  const [isEditingRevenue, setIsEditingRevenue] = useState(false);
  const [revenueData, setRevenueData] = useState({
    monthlyRevenue: user?.monthlyRevenue || 0,
    annualRevenue: user?.annualRevenue || 0
  });
  const [revenueError, setRevenueError] = useState('');
  const [revenueSuccess, setRevenueSuccess] = useState('');

  // Push notification states
  const [pushEnabled, setPushEnabled] = useState(user?.pushNotificationsEnabled ?? true);
  const [paymentReminderDays, setPaymentReminderDays] = useState(user?.paymentReminderDays || 3);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushError, setPushError] = useState('');
  const [pushSuccess, setPushSuccess] = useState('');

  // Calendar subscription states
  const [calendarUrl, setCalendarUrl] = useState('');
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarCopied, setCalendarCopied] = useState(false);

  // Sync emailData, emailNotifications, revenue, and push settings when user prop changes or modal opens
  useEffect(() => {
    if (isOpen && user) {
      setEmailData({ email: user.email || '' });
      setEmailNotifications(user.emailNotifications ?? true);
      setRevenueData({
        monthlyRevenue: user.monthlyRevenue || 0,
        annualRevenue: user.annualRevenue || 0
      });
      setPushEnabled(user.pushNotificationsEnabled ?? true);
      setPaymentReminderDays(user.paymentReminderDays || 3);
    }
  }, [isOpen, user]);

  // Initialize push notification status
  useEffect(() => {
    const initPushStatus = async () => {
      setPushSupported(isPushSupported());
      setPushPermission(getNotificationPermission());

      if (isPushSupported()) {
        const subscribed = await checkSubscriptionStatus();
        setIsSubscribed(subscribed);
      }
    };

    if (isOpen) {
      initPushStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError(t('profile.passwordMismatch'));
      return;
    }

    if (passwordData.newPassword.length < 12) {
      setError(t('profile.passwordTooShort'));
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword)) {
      setError(t('profile.passwordRequirements'));
      return;
    }

    try {
      await axios.put('/api/auth/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setSuccess(t('profile.passwordUpdated'));
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setIsChangingPassword(false);
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || t('profile.errorChangingPassword'));
    }
  };

  const handleEmailUpdate = async (e) => {
    e.preventDefault();
    setEmailError('');
    setEmailSuccess('');

    try {
      await axios.put('/api/auth/email', {
        email: emailData.email
      });

      setEmailSuccess(t('profile.emailUpdateSuccess'));

      // Refresh user data from backend
      await refreshUser();

      setTimeout(() => {
        setIsEditingEmail(false);
        setEmailSuccess('');
      }, 2000);
    } catch (err) {
      setEmailError(err.response?.data?.message || t('profile.errorUpdatingEmail'));
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    setEmailError('');
    setEmailSuccess('');

    try {
      await axios.post('/api/auth/resend-verification');
      setEmailSuccess(t('profile.verificationEmailSent'));

      setTimeout(() => {
        setEmailSuccess('');
      }, 3000);
    } catch (err) {
      setEmailError(err.response?.data?.message || t('profile.errorSendingVerification'));
    } finally {
      setResendLoading(false);
    }
  };

  const handleNotificationToggle = async (e) => {
    const newValue = e.target.checked;
    setEmailNotifications(newValue);

    try {
      await axios.put('/api/auth/notifications', {
        emailNotifications: newValue
      });

      // Refresh user data to sync
      await refreshUser();

      setEmailSuccess(newValue ? t('profile.notificationsEnabled') : t('profile.notificationsDisabled'));
      setTimeout(() => {
        setEmailSuccess('');
      }, 2000);
    } catch (err) {
      setEmailError(err.response?.data?.message || t('profile.errorUpdatingNotifications'));
      // Revert on error
      setEmailNotifications(!newValue);
    }
  };

  const handleRevenueUpdate = async (e) => {
    e.preventDefault();
    setRevenueError('');
    setRevenueSuccess('');

    try {
      await axios.put('/api/auth/revenue', {
        monthlyRevenue: parseFloat(revenueData.monthlyRevenue) || 0,
        annualRevenue: parseFloat(revenueData.annualRevenue) || 0
      });

      setRevenueSuccess(t('profile.revenueUpdateSuccess'));

      // Refresh user data from backend
      await refreshUser();

      setTimeout(() => {
        setIsEditingRevenue(false);
        setRevenueSuccess('');
      }, 2000);
    } catch (err) {
      setRevenueError(err.response?.data?.message || t('profile.errorUpdatingRevenue'));
    }
  };

  const handleEnablePushNotifications = async () => {
    setPushLoading(true);
    setPushError('');
    setPushSuccess('');

    try {
      // Request permission
      const permission = await requestNotificationPermission();
      setPushPermission(permission);

      if (permission === 'granted') {
        // Subscribe to push
        await subscribeToPush();
        setIsSubscribed(true);

        // Update backend preferences
        await axios.put('/api/auth/push-preferences', {
          pushNotificationsEnabled: true,
          paymentReminderDays
        });

        await refreshUser();
        setPushEnabled(true);
        setPushSuccess(t('profile.pushNotificationsEnabled'));

        setTimeout(() => setPushSuccess(''), 3000);
      } else {
        setPushError(t('profile.pushPermissionDenied'));
      }
    } catch (error) {
      console.error('Failed to enable push notifications:', error);
      setPushError(t('profile.errorEnablingPush'));
    } finally {
      setPushLoading(false);
    }
  };

  const handleDisablePushNotifications = async () => {
    setPushLoading(true);
    setPushError('');
    setPushSuccess('');

    try {
      // Unsubscribe from push
      await unsubscribeFromPush();
      setIsSubscribed(false);

      // Update backend preferences
      await axios.put('/api/auth/push-preferences', {
        pushNotificationsEnabled: false,
        paymentReminderDays
      });

      await refreshUser();
      setPushEnabled(false);
      setPushSuccess(t('profile.pushNotificationsDisabled'));

      setTimeout(() => setPushSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to disable push notifications:', error);
      setPushError(t('profile.errorDisablingPush'));
    } finally {
      setPushLoading(false);
    }
  };

  const handlePaymentReminderDaysChange = async (days) => {
    setPaymentReminderDays(days);

    try {
      await axios.put('/api/auth/push-preferences', {
        pushNotificationsEnabled: pushEnabled,
        paymentReminderDays: days
      });

      await refreshUser();
      setPushSuccess(t('profile.reminderDaysUpdated'));
      setTimeout(() => setPushSuccess(''), 2000);
    } catch (error) {
      console.error('Failed to update reminder days:', error);
      setPushError(t('profile.errorUpdatingReminderDays'));
    }
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(subscriptions, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `subly-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    const headers = [t('subscription.name'), t('subscription.amount'), t('subscription.billingCycle'), t('subscription.category'), t('subscription.startDate'), t('subscription.nextBilling'), t('subscription.active'), t('subscription.notes')];
    const rows = subscriptions.map(sub => [
      sub.name,
      sub.amount,
      sub.billingCycle === 'monthly' ? t('subscription.monthly') : t('subscription.annual'),
      sub.category,
      new Date(sub.startDate).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US'),
      new Date(sub.nextBillingDate).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US'),
      sub.isActive ? t('common.yes') : t('common.no'),
      sub.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `subly-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadCalendar = async () => {
    try {
      const response = await axios.get('/api/subscriptions/calendar.ics', {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'subly-subscriptions.ics';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download calendar:', error);
      setEmailError(t('profile.error'));
    }
  };

  const getCalendarUrl = async () => {
    setCalendarLoading(true);
    try {
      const response = await axios.get('/api/subscriptions/calendar-token');
      setCalendarUrl(response.data.calendarUrl);
    } catch (error) {
      console.error('Failed to get calendar URL:', error);
      setEmailError(t('profile.error'));
    } finally {
      setCalendarLoading(false);
    }
  };

  const copyCalendarUrl = () => {
    navigator.clipboard.writeText(calendarUrl);
    setCalendarCopied(true);
    setTimeout(() => setCalendarCopied(false), 2000);
  };

  const accountAge = user?.createdAt
    ? Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="profile-modal-overlay">
      <div className="profile-modal-container">
        {/* Header */}
        <div className="profile-modal-header">
          <div className="profile-modal-header-left">
            <User size={24} />
            <h2 className="profile-modal-title">
              &gt; {t('profile.userProfile').toUpperCase()}
            </h2>
          </div>
          <button onClick={onClose} className="profile-modal-close">
            <X size={24} />
          </button>
        </div>

        <div className="profile-modal-content">
          {/* User Info */}
          <div className="profile-info-section">
            <div className="profile-info-item">
              <span className="profile-info-label">{getCurrencySymbol()}</span>
              <span style={{ fontWeight: 'bold' }}>{t('auth.username')}:</span>
              <span className="profile-info-value">{user?.username}</span>
            </div>
            {user?.createdAt && (
              <div className="profile-info-item">
                <Calendar size={16} style={{ opacity: 0.7 }} />
                <span className="profile-info-label">{t('profile.memberFor')}:</span>
                <span className="profile-info-value">{accountAge} {t('profile.days')}</span>
              </div>
            )}
            <div className="profile-info-item">
              <span className="profile-info-label">📊</span>
              <span className="profile-info-label">{t('dashboard.subscriptions')}:</span>
              <span className="profile-info-value">{subscriptions?.length || 0}</span>
            </div>
          </div>

          {/* Admin Section */}
          {user?.role === 'admin' && (
            <div className="profile-section profile-admin-section">
              <div className="profile-section-header">
                <Shield size={20} />
                <h3 className="profile-section-title">&gt; {t('admin.panel')}</h3>
              </div>
              <p className="profile-section-description">
                {t('profile.adminDescription')}
              </p>
              <button
                onClick={() => {
                  navigate('/admin');
                  onClose();
                }}
                className="profile-btn-admin"
              >
                <Shield size={16} />
                {t('profile.goToAdminPanel')}
              </button>
            </div>
          )}

          {/* Export Section */}
          <div className="profile-section">
            <div className="profile-section-header">
              <Download size={20} />
              <h3 className="profile-section-title">&gt; {t('profile.exportData')}</h3>
            </div>
            <p className="profile-section-description">
              {t('profile.exportDescription')}
            </p>
            <div className="profile-export-buttons">
              <button onClick={exportToJSON} className="profile-btn">
                <Download size={16} />
                {t('profile.exportJSON')}
              </button>
              <button onClick={exportToCSV} className="profile-btn">
                <Download size={16} />
                {t('profile.exportCSV')}
              </button>
            </div>
          </div>

          {/* Calendar Subscription Section */}
          <div className="profile-section">
            <div className="profile-section-header">
              <Calendar size={20} />
              <h3 className="profile-section-title">&gt; {t('profile.calendarSync')}</h3>
            </div>
            <p className="profile-section-description">
              {t('profile.calendarDescription')}
            </p>

            {/* Calendar Subscription URL */}
            <div>
              <label className="profile-form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Link size={16} />
                {t('profile.calendarUrl')}
              </label>
              {!calendarUrl ? (
                <button
                  onClick={getCalendarUrl}
                  className="profile-btn"
                  disabled={calendarLoading}
                >
                  <Link size={16} />
                  {calendarLoading ? t('common.loading') : t('profile.generateCalendarUrl')}
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={calendarUrl}
                    readOnly
                    className="profile-form-input"
                    style={{ flex: 1, fontFamily: 'monospace', fontSize: '12px' }}
                  />
                  <button onClick={copyCalendarUrl} className="profile-btn">
                    {calendarCopied ? <CheckCircle size={16} /> : <Copy size={16} />}
                    {calendarCopied ? t('profile.copied') : t('profile.copy')}
                  </button>
                </div>
              )}
              {calendarUrl && (
                <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '8px' }}>
                  {t('profile.calendarUrlHint')}
                </p>
              )}
            </div>

            {/* Download Calendar Button */}
            <div className="profile-export-buttons">
              <button onClick={downloadCalendar} className="profile-btn">
                <Download size={16} />
                {t('profile.downloadCalendar')}
              </button>
            </div>
          </div>

          {/* Revenue Section */}
          <div className="profile-section">
            <div className="profile-section-header">
              <DollarSign size={20} />
              <h3 className="profile-section-title">&gt; {t('profile.revenue')}</h3>
            </div>
            <p className="profile-section-description">
              {t('profile.revenueDescription')}
            </p>

            {revenueError && (
              <div className="profile-alert-error">
                {revenueError}
              </div>
            )}
            {revenueSuccess && (
              <div className="profile-alert-success">
                {revenueSuccess}
              </div>
            )}

            {!isEditingRevenue ? (
              <div className="profile-revenue-display">
                <div className="profile-revenue-info">
                  <div className="revenue-item">
                    <span className="revenue-label">{t('profile.monthlyRevenue')}:</span>
                    <span className="revenue-value">
                      {getCurrencySymbol()}{revenueData.monthlyRevenue.toFixed(2)}
                    </span>
                  </div>
                  <div className="revenue-item">
                    <span className="revenue-label">{t('profile.annualRevenue')}:</span>
                    <span className="revenue-value">
                      {getCurrencySymbol()}{revenueData.annualRevenue.toFixed(2)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditingRevenue(true)}
                  className="profile-btn"
                >
                  {t('profile.updateRevenue')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleRevenueUpdate} className="profile-password-form">
                <div className="profile-form-group">
                  <label className="profile-form-label">
                    {t('profile.monthlyRevenue')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={revenueData.monthlyRevenue}
                    onChange={(e) => setRevenueData({ ...revenueData, monthlyRevenue: e.target.value })}
                    className="profile-form-input"
                    placeholder="0.00"
                  />
                </div>

                <div className="profile-form-group">
                  <label className="profile-form-label">
                    {t('profile.annualRevenue')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={revenueData.annualRevenue}
                    onChange={(e) => setRevenueData({ ...revenueData, annualRevenue: e.target.value })}
                    className="profile-form-input"
                    placeholder="0.00"
                  />
                </div>

                <div className="profile-form-actions">
                  <button type="submit" className="profile-btn-primary">
                    {t('common.save')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingRevenue(false);
                      setRevenueData({
                        monthlyRevenue: user?.monthlyRevenue || 0,
                        annualRevenue: user?.annualRevenue || 0
                      });
                      setRevenueError('');
                      setRevenueSuccess('');
                    }}
                    className="profile-btn-secondary"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Appearance Section */}
          <div className="profile-section">
            <div className="profile-section-header">
              <Palette size={20} />
              <h3 className="profile-section-title">&gt; {t('profile.appearance')}</h3>
            </div>
            <p className="profile-section-description">
              {t('profile.appearanceDescription')}
            </p>
            <div className="profile-theme-selector">
              <span className="theme-label">{t('profile.theme')}:</span>
              <div className="theme-dropdown">
                <Palette size={16} />
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="theme-select"
                >
                  <option value="dark">{t('profile.terminalDark')}</option>
                  <option value="dracula">{t('themes.dracula')}</option>
                  <option value="nord">{t('themes.nord')}</option>
                  <option value="solarized">{t('profile.solarizedDark')}</option>
                  <option value="light">{t('profile.lightMode')}</option>
                </select>
              </div>
            </div>
            <div className="profile-theme-selector">
              <span className="theme-label">{t('profile.language')}:</span>
              <div className="theme-dropdown">
                <Languages size={16} />
                <select
                  value={i18n.language}
                  onChange={async (e) => {
                    const newLanguage = e.target.value;
                    i18n.changeLanguage(newLanguage);
                    localStorage.setItem('language', newLanguage);

                    // Save language preference to backend
                    try {
                      await axios.put('/api/auth/push-preferences', {
                        language: newLanguage
                      });
                      await refreshUser();
                    } catch (error) {
                      console.error('Failed to update language preference:', error);
                    }
                  }}
                  className="theme-select"
                >
                  <option value="en">{t('languages.en')}</option>
                  <option value="fr">{t('languages.fr')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Email & Notifications Section */}
          <div className="profile-section">
            <div className="profile-section-header">
              <Mail size={20} />
              <h3 className="profile-section-title">&gt; {t('profile.emailAndNotifications')}</h3>
            </div>
            <p className="profile-section-description">
              {t('profile.emailDescription')}
            </p>

            {emailError && (
              <div className="profile-alert-error">
                {emailError}
              </div>
            )}
            {emailSuccess && (
              <div className="profile-alert-success">
                {emailSuccess}
              </div>
            )}

            {!isEditingEmail ? (
              <div className="profile-email-display">
                <div className="profile-email-info">
                  <span className="email-label">{t('auth.email')}:</span>
                  <span className="email-value">
                    {user?.email || t('profile.noEmailSet')}
                  </span>
                  {user?.email && (
                    <span className="email-verification">
                      {user.emailVerified ? (
                        <>
                          <CheckCircle size={16} style={{ color: 'var(--success)' }} />
                          <span style={{ color: 'var(--success)' }}>{t('profile.verified')}</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={16} style={{ color: 'var(--warning)' }} />
                          <span style={{ color: 'var(--warning)' }}>{t('profile.notVerified')}</span>
                        </>
                      )}
                    </span>
                  )}
                </div>
                <div className="profile-email-actions">
                  <button
                    onClick={() => {
                      setIsEditingEmail(true);
                      setEmailData({ email: user?.email || '' });
                    }}
                    className="profile-btn"
                  >
                    {user?.email ? t('profile.updateEmail') : t('profile.addEmail')}
                  </button>
                  {user?.email && !user?.emailVerified && (
                    <button
                      onClick={handleResendVerification}
                      className="profile-btn-resend"
                      disabled={resendLoading}
                    >
                      <Send size={16} />
                      {resendLoading ? t('profile.sending') : t('profile.resendVerification')}
                    </button>
                  )}
                </div>

                {/* Email Notifications Toggle */}
                <div>
                  <div className="profile-notification-toggle">
                    <div className="notification-toggle-header">
                      <Bell size={18} />
                      <span className="notification-toggle-label">{t('profile.emailNotifications')}</span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={handleNotificationToggle}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  <p className="notification-description">
                    {t('profile.notificationDescription')}
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleEmailUpdate} className="profile-password-form">
                {emailError && (
                  <div className="profile-alert-error">
                    {emailError}
                  </div>
                )}
                {emailSuccess && (
                  <div className="profile-alert-success">
                    {emailSuccess}
                  </div>
                )}

                <div className="profile-form-group">
                  <label className="profile-form-label">
                    {t('profile.emailAddress')}
                  </label>
                  <input
                    type="email"
                    value={emailData.email}
                    onChange={(e) => setEmailData({ email: e.target.value })}
                    className="profile-form-input"
                    required
                    placeholder={t('profile.emailPlaceholder')}
                  />
                </div>

                <div className="profile-form-actions">
                  <button type="submit" className="profile-btn-primary">
                    {t('profile.saveEmail')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingEmail(false);
                      setEmailData({ email: user?.email || '' });
                      setEmailError('');
                      setEmailSuccess('');
                    }}
                    className="profile-btn-secondary"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Push Notifications Section */}
          <div className="profile-section">
            <div className="profile-section-header">
              <Bell size={20} />
              <h3 className="profile-section-title">&gt; {t('profile.pushNotifications')}</h3>
            </div>
            <p className="profile-section-description">
              {t('profile.pushNotificationsDescription')}
            </p>

            {pushError && (
              <div className="profile-alert-error">
                {pushError}
              </div>
            )}
            {pushSuccess && (
              <div className="profile-alert-success">
                {pushSuccess}
              </div>
            )}

            {!pushSupported ? (
              <div className="profile-alert-error">
                {t('profile.browserNotSupported')}
              </div>
            ) : (
              <div className="profile-push-controls">
                {/* Push Notifications Toggle */}
                <div className="profile-notification-toggle">
                  <div className="notification-toggle-header">
                    <Bell size={18} />
                    <span className="notification-toggle-label">{t('profile.pushNotifications')}</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={isSubscribed}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleEnablePushNotifications();
                        } else {
                          handleDisablePushNotifications();
                        }
                      }}
                      disabled={pushLoading}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                {/* Permission Status Info */}
                {pushPermission === 'denied' && (
                  <div className="profile-alert-error">
                    {t('profile.pushPermissionDenied')}
                  </div>
                )}

                {/* Payment Reminder Days Selector */}
                {isSubscribed && (
                  <div className="profile-reminder-days">
                    <label className="profile-form-label">
                      {t('profile.paymentReminderDays')}
                    </label>
                    <div className="theme-dropdown" style={{ maxWidth: '200px', marginTop: '8px' }}>
                      <Calendar size={16} />
                      <select
                        value={paymentReminderDays}
                        onChange={(e) => handlePaymentReminderDaysChange(Number(e.target.value))}
                        className="theme-select"
                      >
                        <option value={1}>{t('profile.reminderDays1')}</option>
                        <option value={3}>{t('profile.reminderDays3')}</option>
                        <option value={7}>{t('profile.reminderDays7')}</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Password Change Section */}
          <div className="profile-section">
            <div className="profile-section-header">
              <Lock size={20} />
              <h3 className="profile-section-title">&gt; {t('profile.security')}</h3>
            </div>

            {!isChangingPassword ? (
              <button
                onClick={() => setIsChangingPassword(true)}
                className="profile-btn"
              >
                {t('profile.changePassword')}
              </button>
            ) : (
              <form onSubmit={handlePasswordChange} className="profile-password-form">
                {error && (
                  <div className="profile-alert-error">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="profile-alert-success">
                    {success}
                  </div>
                )}

                <div className="profile-form-group">
                  <label className="profile-form-label">
                    {t('profile.currentPassword')}
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="profile-form-input"
                    required
                  />
                </div>

                <div className="profile-form-group">
                  <label className="profile-form-label">
                    {t('profile.newPassword')}
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="profile-form-input"
                    required
                    minLength={12}
                    placeholder={t('profile.passwordPlaceholder')}
                  />
                  <small style={{ color: 'var(--text-dim)', fontSize: '11px' }}>
                    {t('profile.passwordHint')}
                  </small>
                </div>

                <div className="profile-form-group">
                  <label className="profile-form-label">
                    {t('profile.confirmNewPassword')}
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="profile-form-input"
                    required
                  />
                </div>

                <div className="profile-form-actions">
                  <button type="submit" className="profile-btn-primary">
                    {t('common.confirm')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      setError('');
                      setSuccess('');
                    }}
                    className="profile-btn-secondary"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;