import express from 'express';
import PushSubscription from '../models/PushSubscription.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get VAPID public key
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// Subscribe to push notifications
router.post('/subscribe', protect, async (req, res) => {
  try {
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ message: 'Invalid subscription data' });
    }

    // Check if subscription already exists
    let subscription = await PushSubscription.findOne({
      user: req.user._id,
      endpoint
    });

    if (subscription) {
      // Update existing subscription
      subscription.keys = keys;
      subscription.userAgent = req.headers['user-agent'];
      subscription.isActive = true;
      await subscription.save();
    } else {
      // Create new subscription
      subscription = await PushSubscription.create({
        user: req.user._id,
        endpoint,
        keys,
        userAgent: req.headers['user-agent']
      });
    }

    res.status(201).json({ message: 'Subscription saved successfully' });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    res.status(500).json({ message: 'Failed to save subscription' });
  }
});

// Unsubscribe from push notifications
router.post('/unsubscribe', protect, async (req, res) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ message: 'Endpoint is required' });
    }

    await PushSubscription.findOneAndUpdate(
      { user: req.user._id, endpoint },
      { isActive: false }
    );

    res.json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('Error unsubscribing:', error);
    res.status(500).json({ message: 'Failed to unsubscribe' });
  }
});

// Get user's subscription status
router.get('/status', protect, async (req, res) => {
  try {
    const subscription = await PushSubscription.findOne({
      user: req.user._id,
      isActive: true
    });

    res.json({ subscribed: !!subscription });
  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({ message: 'Failed to get subscription status' });
  }
});

export default router;