import webpush from 'web-push';
import PushSubscription from '../models/PushSubscription.js';
import { getTranslation } from '../utils/notificationTranslations.js';

// Initialize VAPID configuration (called from server.js after dotenv is loaded)
let isInitialized = false;

export function initializePushService() {
  if (!isInitialized) {
    // Check if VAPID credentials are configured (must exist and not be empty)
    const hasVapidSubject = process.env.VAPID_SUBJECT && process.env.VAPID_SUBJECT.trim() !== '';
    const hasVapidPublicKey = process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PUBLIC_KEY.trim() !== '';
    const hasVapidPrivateKey = process.env.VAPID_PRIVATE_KEY && process.env.VAPID_PRIVATE_KEY.trim() !== '';

    if (!hasVapidSubject || !hasVapidPublicKey || !hasVapidPrivateKey) {
      console.log('⚠️  Push notification service disabled (VAPID credentials not configured)');
      console.log('   To enable push notifications, set VAPID_SUBJECT, VAPID_PUBLIC_KEY, and VAPID_PRIVATE_KEY');
      return;
    }

    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    isInitialized = true;
    console.log('🔔 Push notification service initialized');
  }
}

// Send push notification to a specific user
export async function sendPushToUser(userId, payload) {
  // If push service is not initialized, skip silently
  if (!isInitialized) {
    return { success: false, message: 'Push notification service not initialized' };
  }

  try {
    // Get all active subscriptions for this user
    const subscriptions = await PushSubscription.find({
      user: userId,
      isActive: true
    });

    if (subscriptions.length === 0) {
      return { success: false, message: 'No active subscriptions found' };
    }

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    // Send notification to all subscriptions
    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.keys.p256dh,
              auth: subscription.keys.auth
            }
          },
          JSON.stringify(payload)
        );
        results.success++;
      } catch (error) {
        results.failed++;

        // If subscription is invalid (410 Gone), mark it as inactive
        if (error.statusCode === 410) {
          subscription.isActive = false;
          await subscription.save();
          console.log(`🗑️ Removed invalid subscription for user ${userId}`);
        } else {
          console.error(`Failed to send push to user ${userId}:`, error);
          results.errors.push(error.message);
        }
      }
    }

    return results;
  } catch (error) {
    console.error('Error in sendPushToUser:', error);
    return { success: false, message: error.message };
  }
}

// Send trial ending notification
export async function sendTrialEndingNotification(user, subscription, daysLeft) {
  const language = user.language || 'en';
  const text = getTranslation(language, 'trialEndingSoon', subscription.name, daysLeft);

  // Get frontend URL for icons
  const frontendUrl = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',')[0].trim()
    : 'http://localhost:5174';

  const payload = {
    title: text.title,
    body: text.body,
    icon: subscription.iconUrl || subscription.iconFilename || `${frontendUrl}/icon-192.png`,
    badge: `${frontendUrl}/icon-192.png`,
    tag: `trial-${subscription._id}`,
    data: {
      type: 'trial',
      subscriptionId: subscription._id,
      subscriptionName: subscription.name,
      daysLeft,
      url: '/'
    }
  };

  return await sendPushToUser(user._id, payload);
}

// Send payment reminder notification
export async function sendPaymentReminderNotification(user, subscription, daysUntil) {
  const amount = subscription.isShared ? subscription.myRealCost : subscription.amount;
  const language = user.language || 'en';
  const text = getTranslation(language, 'upcomingPayment', subscription.name, daysUntil, amount);

  // Get frontend URL for icons
  const frontendUrl = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',')[0].trim()
    : 'http://localhost:5174';

  const payload = {
    title: text.title,
    body: text.body,
    icon: subscription.iconUrl || subscription.iconFilename || `${frontendUrl}/icon-192.png`,
    badge: `${frontendUrl}/icon-192.png`,
    tag: `payment-${subscription._id}`,
    data: {
      type: 'payment',
      subscriptionId: subscription._id,
      subscriptionName: subscription.name,
      amount,
      daysUntil,
      url: '/'
    }
  };

  return await sendPushToUser(user._id, payload);
}

export default {
  sendPushToUser,
  sendTrialEndingNotification,
  sendPaymentReminderNotification
};