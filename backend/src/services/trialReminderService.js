import cron from 'node-cron';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import { sendTrialReminderEmail } from './emailService.js';

// Track which subscriptions have been notified (reset daily)
const notifiedToday = new Set();

// Days before trial ends to send reminders
const REMINDER_DAYS = [3, 1]; // Send reminders at 3 days and 1 day before trial ends

// Check for trials ending soon and send reminder emails
export const checkTrialReminders = async () => {
  try {
    console.log('🔍 Checking for trial reminders...');

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Find all active trials
    const trials = await Subscription.find({
      isTrial: true,
      isActive: true,
      trialEndDate: { $exists: true, $ne: null }
    }).populate('user');

    let remindersCount = 0;

    for (const subscription of trials) {
      if (!subscription.user || !subscription.user.email) {
        continue; // Skip if no user or no email
      }

      // Check if user has email notifications enabled
      if (!subscription.user.emailNotifications) {
        continue; // Skip if user disabled email notifications
      }

      const trialEndDate = new Date(subscription.trialEndDate);
      const trialEndDay = new Date(trialEndDate.getFullYear(), trialEndDate.getMonth(), trialEndDate.getDate());

      // Calculate days left
      const daysLeft = Math.ceil((trialEndDay - today) / (1000 * 60 * 60 * 24));

      // Check if we should send a reminder for this subscription
      if (daysLeft > 0 && REMINDER_DAYS.includes(daysLeft)) {
        const notificationKey = `${subscription._id}-${daysLeft}`;

        // Check if we already sent a reminder for this subscription today
        if (!notifiedToday.has(notificationKey)) {
          console.log(`📧 Sending trial reminder: ${subscription.name} (${daysLeft} days left) to ${subscription.user.email}`);

          const result = await sendTrialReminderEmail(subscription.user, subscription, daysLeft);

          if (result.success) {
            notifiedToday.add(notificationKey);
            remindersCount++;
          }
        }
      }
    }

    if (remindersCount > 0) {
      console.log(`✅ Sent ${remindersCount} trial reminder(s)`);
    } else {
      console.log('✓ No trial reminders needed at this time');
    }
  } catch (error) {
    console.error('❌ Error checking trial reminders:', error);
  }
};

/**
 * Start the trial reminder cron job
 * Runs every day at 9:00 AM
 */
export const startTrialReminderCron = () => {
  // Schedule: Run every day at 9:00 AM
  // Format: second minute hour day month weekday
  cron.schedule('0 9 * * *', async () => {
    console.log('⏰ Trial reminder cron job triggered');
    notifiedToday.clear(); // Reset daily notifications
    await checkTrialReminders();
  });

  // Also check immediately on server start (for testing)
  console.log('⏰ Trial reminder cron job started (runs daily at 9:00 AM)');

  // Run once on startup for testing (optional, comment out in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('🧪 Running initial trial reminder check (development mode)...');
    setTimeout(async () => {
      await checkTrialReminders();
    }, 5000); // Wait 5 seconds after server start
  }
};