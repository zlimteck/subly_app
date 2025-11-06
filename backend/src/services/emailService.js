import resend, { EMAIL_FROM } from '../config/email.js';
import { getVerificationEmailTemplate, getVerificationSuccessEmail, getTrialReminderEmail } from '../utils/emailTemplates.js';

export const sendVerificationEmail = async (user, token) => {
  // Get the first URL from FRONTEND_URL (handles comma-separated URLs)
  const frontendUrl = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',')[0].trim()
    : 'http://localhost:5173';

  const verificationUrl = `${frontendUrl}/verify-email/${token}`;

  try {
    const { data, error } = await resend.emails.send({
      from: `Subly <${EMAIL_FROM}>`,
      to: user.email,
      subject: '✅ Verify Your Email - Subly',
      html: getVerificationEmailTemplate(user.username, verificationUrl)
    });

    if (error) {
      console.error('❌ Error sending verification email:', error);
      throw new Error('Failed to send verification email');
    }

    console.log('📧 Verification email sent:', data.id);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

export const sendWelcomeEmail = async (user) => {
  // Get the first URL from FRONTEND_URL (handles comma-separated URLs)
  const frontendUrl = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',')[0].trim()
    : 'http://localhost:5173';

  try {
    const { data, error } = await resend.emails.send({
      from: `Subly <${EMAIL_FROM}>`,
      to: user.email,
      subject: '🎉 Email Verified - Welcome to Subly!',
      html: getVerificationSuccessEmail(user.username, frontendUrl)
    });

    if (error) {
      console.error('❌ Error sending welcome email:', error);
      return { success: false, error: error.message };
    }

    console.log('📧 Welcome email sent:', data.id);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    // Don't throw error for welcome email, it's not critical
    return { success: false, error: error.message };
  }
};

export const sendTrialReminderEmail = async (user, subscription, daysLeft) => {
  // Get the first URL from FRONTEND_URL (handles comma-separated URLs)
  const frontendUrl = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',')[0].trim()
    : 'http://localhost:5173';

  try {
    const { data, error } = await resend.emails.send({
      from: `Subly Trial Reminder <${EMAIL_FROM}>`,
      to: user.email,
      subject: `⏰ Trial Ending ${daysLeft === 1 ? 'Tomorrow' : `in ${daysLeft} days`} - ${subscription.name}`,
      html: getTrialReminderEmail(user.username, subscription, daysLeft, frontendUrl)
    });

    if (error) {
      console.error('❌ Error sending trial reminder email:', error);
      return { success: false, error: error.message };
    }

    console.log('📧 Trial reminder email sent:', data.id, `(${subscription.name}, ${daysLeft} days)`);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('❌ Error sending trial reminder email:', error);
    // Don't throw error, just log it
    return { success: false, error: error.message };
  }
};