import express from 'express';
import { body, validationResult } from 'express-validator';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import ical from 'ical-generator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Public route for calendar subscription (must be before protect middleware)
// @route   GET /api/subscriptions/calendar/:token.ics (public with token)
router.get('/calendar/:token.ics', async (req, res) => {
  try {
    const { token } = req.params;

    // Find user by calendar token
    const user = await User.findOne({ calendarToken: token });

    if (!user) {
      return res.status(404).json({ message: 'Calendar not found' });
    }

    const subscriptions = await Subscription.find({
      user: user._id,
      isActive: true
    }).sort({ nextBillingDate: 1 });

    // Create iCal calendar
    const calendar = ical({
      name: 'Subly - Subscription Payments',
      prodId: {
        company: 'Subly',
        product: 'Subscription Tracker',
        language: 'EN'
      },
      timezone: 'UTC'
    });

    // Add event for each subscription
    subscriptions.forEach(sub => {
      const amount = sub.isShared ? sub.myRealCost : sub.amount;
      const currency = '€'; // TODO: get from user preferences

      // Create recurring event
      const event = calendar.createEvent({
        start: new Date(sub.nextBillingDate),
        summary: `${sub.name} - ${amount}${currency}`,
        description: `Category: ${sub.category || 'Other'}\nAmount: ${amount}${currency}\nBilling cycle: ${sub.billingCycle}${sub.notes ? '\nNotes: ' + sub.notes : ''}`,
        url: process.env.FRONTEND_URL,
        location: 'Online',
        allDay: true
      });

      // Set recurrence based on billing cycle
      if (sub.billingCycle === 'monthly') {
        event.repeating({
          freq: 'MONTHLY',
          interval: 1
        });
      } else if (sub.billingCycle === 'annual') {
        event.repeating({
          freq: 'YEARLY',
          interval: 1
        });
      }

      // Add reminder based on user preference (default 3 days before)
      const reminderDays = user.paymentReminderDays || 3;
      event.createAlarm({
        type: 'display',
        trigger: 60 * 60 * 24 * reminderDays * -1 // X days before in seconds
      });
    });

    // Set response headers for iCal file
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline; filename="subly-subscriptions.ics"');

    // Send iCal feed
    res.send(calendar.toString());
  } catch (error) {
    console.error('Error generating iCal feed:', error);
    res.status(500).json({ message: 'Server error generating calendar', error: error.message });
  }
});

// All routes below are protected
router.use(protect);

// @route   GET /api/subscriptions
router.get('/', async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/subscriptions/stats
router.get('/stats', async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ user: req.user._id, isActive: true });

    let totalMonthly = 0;
    let totalAnnual = 0;
    let totalMonthlyOnly = 0; // Only pure monthly subscriptions

    subscriptions.forEach(sub => {
      // Use real cost (considering sharing)
      const realCost = sub.isShared ? sub.myRealCost : sub.amount;

      if (sub.billingCycle === 'monthly') {
        totalMonthly += realCost;
        totalMonthlyOnly += realCost;
      } else {
        totalAnnual += realCost;
        totalMonthly += realCost / 12; // Add monthly equivalent
      }
    });

    // Group by category (using real monthly cost)
    const byCategory = subscriptions.reduce((acc, sub) => {
      const category = sub.category || 'Other';
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += sub.myMonthlyCost;
      return acc;
    }, {});

    res.json({
      totalMonthly: Math.round(totalMonthly * 100) / 100,
      totalMonthlyOnly: Math.round(totalMonthlyOnly * 100) / 100,
      totalAnnual: Math.round(totalAnnual * 100) / 100,
      totalYearly: Math.round(totalMonthly * 12 * 100) / 100,
      count: subscriptions.length,
      byCategory
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/subscriptions
router.post('/', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('billingCycle').isIn(['monthly', 'annual']).withMessage('Billing cycle must be monthly or annual'),
  body('nextBillingDate').isISO8601().withMessage('Valid date required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const subscription = await Subscription.create({
      user: req.user._id,
      ...req.body
    });

    res.status(201).json(subscription);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/subscriptions/:id
router.put('/:id', async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    // Check user owns this subscription
    if (subscription.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // If iconFilename is being changed, delete old icon file
    if (req.body.iconFilename && subscription.iconFilename && req.body.iconFilename !== subscription.iconFilename) {
      const oldFilePath = path.join(__dirname, '../../uploads', subscription.iconFilename);
      if (fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath);
          console.log(`🗑️  Deleted old icon file: ${subscription.iconFilename}`);
        } catch (err) {
          console.error(`Failed to delete old icon file: ${err.message}`);
        }
      }
    }

    const updatedSubscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(updatedSubscription);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/subscriptions/:id
router.delete('/:id', async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    // Check user owns this subscription
    if (subscription.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Delete associated icon file if exists
    if (subscription.iconFilename) {
      const filePath = path.join(__dirname, '../../uploads', subscription.iconFilename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`🗑️  Deleted icon file: ${subscription.iconFilename}`);
        } catch (err) {
          console.error(`Failed to delete icon file: ${err.message}`);
        }
      }
    }

    await subscription.deleteOne();

    res.json({ message: 'Subscription removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/subscriptions/calendar-token
router.get('/calendar-token', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const token = user.getCalendarToken();
    await user.save();

    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) {
      return res.status(500).json({ message: 'BACKEND_URL not configured in environment variables' });
    }

    const calendarUrl = `${backendUrl}/api/subscriptions/calendar/${token}.ics`;

    res.json({
      token,
      calendarUrl
    });
  } catch (error) {
    console.error('Error generating calendar token:', error);
    res.status(500).json({ message: 'Server error generating calendar token', error: error.message });
  }
});

// @route   GET /api/subscriptions/calendar.ics (download with JWT auth)
router.get('/calendar.ics', protect, async (req, res) => {
  try {
    const subscriptions = await Subscription.find({
      user: req.user._id,
      isActive: true
    }).sort({ nextBillingDate: 1 });

    // Create iCal calendar
    const calendar = ical({
      name: 'Subly - Subscription Payments',
      prodId: {
        company: 'Subly',
        product: 'Subscription Tracker',
        language: 'EN'
      },
      timezone: 'UTC'
    });

    // Add event for each subscription
    subscriptions.forEach(sub => {
      const amount = sub.isShared ? sub.myRealCost : sub.amount;
      const currency = '€'; // TODO: get from user preferences

      // Create recurring event
      const event = calendar.createEvent({
        start: new Date(sub.nextBillingDate),
        summary: `${sub.name} - ${amount}${currency}`,
        description: `Category: ${sub.category || 'Other'}\nAmount: ${amount}${currency}\nBilling cycle: ${sub.billingCycle}${sub.notes ? '\nNotes: ' + sub.notes : ''}`,
        url: process.env.FRONTEND_URL,
        location: 'Online',
        allDay: true
      });

      // Set recurrence based on billing cycle
      if (sub.billingCycle === 'monthly') {
        event.repeating({
          freq: 'MONTHLY',
          interval: 1
        });
      } else if (sub.billingCycle === 'annual') {
        event.repeating({
          freq: 'YEARLY',
          interval: 1
        });
      }

      // Add reminder based on user preference (default 3 days before)
      const reminderDays = req.user.paymentReminderDays || 3;
      event.createAlarm({
        type: 'display',
        trigger: 60 * 60 * 24 * reminderDays * -1 // X days before in seconds
      });
    });

    // Set response headers for iCal file
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="subly-subscriptions.ics"');

    // Send iCal feed
    res.send(calendar.toString());
  } catch (error) {
    console.error('Error generating iCal feed:', error);
    res.status(500).json({ message: 'Server error generating calendar', error: error.message });
  }
});

export default router;