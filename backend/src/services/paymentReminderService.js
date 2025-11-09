import cron from 'node-cron';
import Subscription from '../models/Subscription.js';
import { sendPaymentReminderNotification } from './pushNotificationService.js';

// Track which subscriptions have been notified (reset daily)
const notifiedToday = new Set();

// Check for upcoming payments and send push reminders
export const checkPaymentReminders = async () => {
  try {
    console.log('🔍 Checking for payment reminders...');

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Find all active subscriptions (not trials)
    const subscriptions = await Subscription.find({
      isTrial: false,
      isActive: true
    }).populate('user');

    let remindersCount = 0;

    for (const subscription of subscriptions) {
      if (!subscription.user) {
        continue; // Skip if no user
      }

      // Check if user has push notifications enabled
      if (!subscription.user.pushNotificationsEnabled) {
        continue;
      }

      const nextBillingDate = new Date(subscription.nextBillingDate);
      const billingDay = new Date(nextBillingDate.getFullYear(), nextBillingDate.getMonth(), nextBillingDate.getDate());

      // Calculate days until payment
      const daysUntil = Math.ceil((billingDay - today) / (1000 * 60 * 60 * 24));

      // Get user's preferred reminder days (default: 3 days)
      const reminderDays = subscription.user.paymentReminderDays || 3;

      // Check if we should send a reminder for this subscription
      if (daysUntil === reminderDays) {
        const notificationKey = `${subscription._id}-${daysUntil}`;

        // Check if we already sent a reminder for this subscription today
        if (!notifiedToday.has(notificationKey)) {
          console.log(`🔔 Sending payment reminder: ${subscription.name} (${daysUntil} days until payment)`);

          const pushResult = await sendPaymentReminderNotification(subscription.user, subscription, daysUntil);

          if (pushResult.success > 0) {
            notifiedToday.add(notificationKey);
            remindersCount++;
          }
        }
      }
    }

    if (remindersCount > 0) {
      console.log(`✅ Sent ${remindersCount} payment reminder(s)`);
    } else {
      console.log('✓ No payment reminders needed at this time');
    }
  } catch (error) {
    console.error('❌ Error checking payment reminders:', error);
  }
};

// Start the payment reminder cron job runs every day at 9:00 AM
export const startPaymentReminderCron = () => {
  // Get timezone from environment variable (default: UTC)
  const timezone = process.env.TZ || 'UTC';

  cron.schedule('0 9 * * *', async () => {
    console.log('⏰ Payment reminder cron job triggered');
    notifiedToday.clear(); // Reset daily notifications
    await checkPaymentReminders();
  }, {
    timezone
  });

  console.log(`⏰ Payment reminder cron job started (runs daily at 9:00 AM ${timezone})`);

  // Run once on startup for testing (optional, comment out in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('🧪 Running initial payment reminder check (development mode)...');
    setTimeout(async () => {
      await checkPaymentReminders();
    }, 5000); // Wait 5 seconds after server start
  }
};