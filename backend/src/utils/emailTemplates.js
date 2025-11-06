export const getVerificationEmailTemplate = (username, verificationUrl) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - Subly</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Courier New', Courier, monospace;
      background: linear-gradient(135deg, #0a0e14 0%, #0f1419 100%);
      padding: 40px 20px;
      color: #00ff41;
    }

    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #1a1f26;
      border: 2px solid #00ff41;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 0 30px rgba(0, 255, 65, 0.2);
    }

    .header {
      background: #0f1419;
      padding: 30px;
      text-align: center;
      border-bottom: 2px solid #00ff41;
    }

    .logo-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 15px;
      margin-bottom: 15px;
    }

    .logo {
      width: 50px;
      height: 50px;
    }

    .title {
      font-size: 48px;
      font-weight: bold;
      color: #00ff41;
      letter-spacing: 8px;
      text-shadow: 0 0 20px rgba(0, 255, 65, 0.5);
    }

    .terminal-prompt {
      color: #00ff41;
      font-size: 14px;
      margin-top: 10px;
    }

    .content {
      padding: 40px 30px;
    }

    .greeting {
      font-size: 18px;
      color: #00ff41;
      margin-bottom: 20px;
    }

    .message {
      font-size: 14px;
      color: #a8b3c1;
      line-height: 1.8;
      margin-bottom: 30px;
    }

    .message strong {
      color: #00ff41;
    }

    .cta-container {
      text-align: center;
      margin: 40px 0;
    }

    .cta-button {
      display: inline-block;
      padding: 15px 40px;
      background: #00ff41;
      color: #000000;
      text-decoration: none;
      font-weight: bold;
      font-size: 16px;
      letter-spacing: 2px;
      border-radius: 6px;
      box-shadow: none;
      transition: all 0.3s ease;
    }

    .cta-button:hover {
      background: #00e63d;
      box-shadow: none;
    }

    .alternative-link {
      margin-top: 30px;
      padding: 20px;
      background: #0f1419;
      border: 1px solid #2d3748;
      border-radius: 6px;
    }

    .alternative-link p {
      font-size: 12px;
      color: #718096;
      margin-bottom: 10px;
    }

    .link-text {
      font-size: 12px;
      color: #00ff41;
      word-break: break-all;
      background: #0a0e14;
      padding: 10px;
      border-radius: 4px;
      border: 1px solid #2d3748;
    }

    .footer {
      padding: 30px;
      text-align: center;
      background: #0f1419;
      border-top: 2px solid #2d3748;
    }

    .footer-text {
      font-size: 12px;
      color: #718096;
      margin-bottom: 10px;
    }

    .security-notice {
      font-size: 11px;
      color: #ff9900;
      margin-top: 20px;
      padding: 15px;
      background: rgba(255, 153, 0, 0.1);
      border: 1px solid rgba(255, 153, 0, 0.3);
      border-radius: 6px;
    }

    @media only screen and (max-width: 600px) {
      .container {
        border-radius: 0;
      }

      .title {
        font-size: 36px;
        letter-spacing: 4px;
      }

      .content {
        padding: 30px 20px;
      }

      .cta-button {
        padding: 12px 30px;
        font-size: 14px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-container">
        <h1 class="title">SUBLY</h1>
      </div>
      <div class="terminal-prompt">root@subly:~$ verify_email</div>
    </div>

    <div class="content">
      <div class="greeting">
        &gt; Hello <strong>${username}</strong>,
      </div>

      <div class="message">
        <p>Welcome to <strong>Subly</strong>, your terminal-style subscription tracker!</p>
        <br>
        <p>To complete your registration and start tracking your subscriptions, please verify your email address by clicking the button below:</p>
      </div>

      <div class="cta-container">
        <a href="${verificationUrl}" class="cta-button">VERIFY EMAIL</a>
      </div>

      <div class="alternative-link">
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <div class="link-text">${verificationUrl}</div>
      </div>

      <div class="security-notice">
        <strong>⚠️ Security Notice:</strong> This verification link will expire in 24 hours. If you didn't create a Subly account, you can safely ignore this email.
      </div>
    </div>

    <div class="footer">
      <div class="footer-text">
        <span class="terminal-prompt">&gt;</span> This email was sent by Subly
      </div>
      <div class="footer-text">
        © ${new Date().getFullYear()} Subly - Subscription Tracker System
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

export const getTrialReminderEmail = (username, subscription, daysLeft, frontendUrl) => {
  const urgencyClass = daysLeft <= 1 ? 'urgent' : 'warning';
  const urgencyColor = daysLeft <= 1 ? '#ff4444' : '#ff9900';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trial Ending Soon - Subly</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Courier New', Courier, monospace;
      background: linear-gradient(135deg, #0a0e14 0%, #0f1419 100%);
      padding: 40px 20px;
      color: #00ff41;
    }

    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #1a1f26;
      border: 2px solid ${urgencyColor};
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 0 30px rgba(255, 153, 0, 0.3);
    }

    .header {
      background: #0f1419;
      padding: 30px;
      text-align: center;
      border-bottom: 2px solid ${urgencyColor};
    }

    .title {
      font-size: 48px;
      font-weight: bold;
      color: #00ff41;
      letter-spacing: 8px;
      text-shadow: 0 0 20px rgba(0, 255, 65, 0.5);
      margin-bottom: 10px;
    }

    .terminal-prompt {
      color: #00ff41;
      font-size: 14px;
    }

    .content {
      padding: 40px 30px;
    }

    .alert-icon {
      font-size: 64px;
      margin-bottom: 20px;
      text-align: center;
    }

    .greeting {
      font-size: 18px;
      color: #00ff41;
      margin-bottom: 20px;
    }

    .message {
      font-size: 14px;
      color: #a8b3c1;
      line-height: 1.8;
      margin-bottom: 30px;
    }

    .message strong {
      color: #00ff41;
    }

    .subscription-info {
      background: #0f1419;
      border: 2px solid ${urgencyColor};
      border-radius: 8px;
      padding: 20px;
      margin: 30px 0;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #2d3748;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-label {
      color: #718096;
      font-size: 13px;
    }

    .info-value {
      color: #00ff41;
      font-weight: bold;
      font-size: 14px;
    }

    .days-left {
      text-align: center;
      padding: 20px;
      background: rgba(255, 153, 0, 0.1);
      border: 2px solid ${urgencyColor};
      border-radius: 8px;
      margin: 20px 0;
    }

    .days-left-number {
      font-size: 48px;
      font-weight: bold;
      color: ${urgencyColor};
      text-shadow: 0 0 20px ${urgencyColor};
    }

    .days-left-text {
      font-size: 14px;
      color: ${urgencyColor};
      margin-top: 10px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    .cta-container {
      text-align: center;
      margin: 30px 0;
    }

    .cta-button {
      display: inline-block;
      padding: 15px 40px;
      background: #00ff41;
      color: #000000;
      text-decoration: none;
      font-weight: bold;
      font-size: 16px;
      letter-spacing: 2px;
      border-radius: 6px;
      box-shadow: none;
      transition: all 0.3s ease;
    }

    .reminder-note {
      font-size: 12px;
      color: #718096;
      text-align: center;
      margin-top: 30px;
      padding: 15px;
      background: #0f1419;
      border-radius: 6px;
    }

    .footer {
      padding: 30px;
      text-align: center;
      background: #0f1419;
      border-top: 2px solid #2d3748;
    }

    .footer-text {
      font-size: 12px;
      color: #718096;
    }

    @media only screen and (max-width: 600px) {
      .container {
        border-radius: 0;
      }

      .title {
        font-size: 36px;
        letter-spacing: 4px;
      }

      .content {
        padding: 30px 20px;
      }

      .days-left-number {
        font-size: 36px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">SUBLY</h1>
      <div class="terminal-prompt">root@subly:~$ trial_reminder</div>
    </div>

    <div class="content">
      <div class="alert-icon">⏰</div>

      <div class="greeting">
        &gt; Hello <strong>${username}</strong>,
      </div>

      <div class="message">
        <p>Your free trial for <strong>${subscription.name}</strong> is ending soon!</p>
        <br>
        <p>Don't forget to cancel before you're charged, or continue enjoying the service if you love it.</p>
      </div>

      <div class="days-left">
        <div class="days-left-number">${daysLeft}</div>
        <div class="days-left-text">${daysLeft === 1 ? 'Day Left' : 'Days Left'}</div>
      </div>

      <div class="subscription-info">
        <div class="info-row">
          <span class="info-label">Service:</span>
          <span class="info-value">${subscription.name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Trial ends:</span>
          <span class="info-value">${new Date(subscription.trialEndDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Next billing:</span>
          <span class="info-value">${subscription.amount} ${subscription.billingCycle === 'monthly' ? '/month' : '/year'}</span>
        </div>
      </div>

      <div class="cta-container">
        <a href="${frontendUrl}/dashboard" class="cta-button">MANAGE SUBSCRIPTION</a>
      </div>

      <div class="reminder-note">
        💡 <strong>Tip:</strong> You can update or cancel your subscription anytime from your Subly dashboard.
      </div>
    </div>

    <div class="footer">
      <div class="footer-text">
        <span class="terminal-prompt">&gt;</span> This is an automated reminder from Subly
      </div>
      <div class="footer-text">
        © ${new Date().getFullYear()} Subly - Subscription Tracker System
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

export const getVerificationSuccessEmail = (username, frontendUrl) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verified - Subly</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Courier New', Courier, monospace;
      background: linear-gradient(135deg, #0a0e14 0%, #0f1419 100%);
      padding: 40px 20px;
      color: #00ff41;
    }

    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #1a1f26;
      border: 2px solid #00ff41;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 0 30px rgba(0, 255, 65, 0.2);
    }

    .header {
      background: #0f1419;
      padding: 30px;
      text-align: center;
      border-bottom: 2px solid #00ff41;
    }

    .title {
      font-size: 48px;
      font-weight: bold;
      color: #00ff41;
      letter-spacing: 8px;
      text-shadow: 0 0 20px rgba(0, 255, 65, 0.5);
      margin-bottom: 10px;
    }

    .terminal-prompt {
      color: #00ff41;
      font-size: 14px;
    }

    .content {
      padding: 40px 30px;
      text-align: center;
    }

    .success-icon {
      font-size: 64px;
      margin-bottom: 20px;
    }

    .greeting {
      font-size: 24px;
      color: #00ff41;
      margin-bottom: 20px;
    }

    .message {
      font-size: 14px;
      color: #a8b3c1;
      line-height: 1.8;
      margin-bottom: 30px;
    }

    .cta-button {
      display: inline-block;
      padding: 15px 40px;
      background: #00ff41;
      color: #000000;
      text-decoration: none;
      font-weight: bold;
      font-size: 16px;
      letter-spacing: 2px;
      border-radius: 6px;
      box-shadow: none;
      margin-top: 20px;
    }

    .footer {
      padding: 30px;
      text-align: center;
      background: #0f1419;
      border-top: 2px solid #2d3748;
    }

    .footer-text {
      font-size: 12px;
      color: #718096;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">SUBLY</h1>
      <div class="terminal-prompt">root@subly:~$ email_verified</div>
    </div>

    <div class="content">
      <div class="success-icon">✅</div>
      <div class="greeting">Email Verified Successfully!</div>
      <div class="message">
        <p>Hey <strong>${username}</strong>,</p>
        <br>
        <p>Your email has been verified. You're all set to use Subly!</p>
        <br>
        <p>Start tracking your subscriptions and take control of your expenses.</p>
      </div>
      <a href="${frontendUrl}/dashboard" class="cta-button">GO TO DASHBOARD</a>
    </div>

    <div class="footer">
      <div class="footer-text">
        © ${new Date().getFullYear()} Subly - Subscription Tracker System
      </div>
    </div>
  </div>
</body>
</html>
  `;
};