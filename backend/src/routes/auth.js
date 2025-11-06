import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import Invitation from '../models/Invitation.js';
import { protect } from '../middleware/auth.js';
import { sendVerificationEmail, sendWelcomeEmail } from '../services/emailService.js';

const router = express.Router();

// Rate limiter for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiter for registration
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 registration attempts per hour
  message: 'Too many accounts created from this IP, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
});

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @route   POST /api/auth/register
router.post('/register', registerLimiter, [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Please enter a valid email address'),
  body('password')
    .isLength({ min: 12 }).withMessage('Password must be at least 12 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('invitationCode').trim().notEmpty().withMessage('Invitation code is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password, invitationCode, email } = req.body;

  try {
    // Validate invitation code
    const invitation = await Invitation.findOne({ code: invitationCode.toUpperCase() });

    if (!invitation) {
      return res.status(404).json({ message: 'Invalid invitation code' });
    }

    const validation = invitation.isValid();
    if (!validation.valid) {
      return res.status(400).json({ message: validation.reason });
    }

    // Check if user exists
    const userExists = await User.findOne({ username });

    if (userExists) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Check if email is already taken
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Create user
    const user = await User.create({
      username,
      password,
      email
    });

    if (user) {
      // Mark invitation as used
      invitation.isUsed = true;
      invitation.usedBy = user._id;
      invitation.usedAt = new Date();
      await invitation.save();

      // Send verification email automatically
      try {
        const verificationToken = user.generateEmailVerificationToken();
        await user.save();
        await sendVerificationEmail(user, verificationToken);
        console.log('📧 Verification email sent to:', email);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail registration if email send fails
      }

      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        emailVerified: user.emailVerified,
        emailNotifications: user.emailNotifications,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/auth/login
router.post('/login', authLimiter, [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  try {
    // Check for user
    const user = await User.findOne({ username });

    if (user && (await user.matchPassword(password))) {
      // Check if user is soft-deleted
      if (user.isDeleted) {
        return res.status(403).json({ message: 'Your account has been deactivated. Please contact support.' });
      }

      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        emailVerified: user.emailVerified,
        emailNotifications: user.emailNotifications,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json({
    _id: req.user._id,
    username: req.user.username,
    email: req.user.email,
    emailVerified: req.user.emailVerified,
    emailNotifications: req.user.emailNotifications,
    role: req.user.role,
    monthlyRevenue: req.user.monthlyRevenue,
    annualRevenue: req.user.annualRevenue,
    createdAt: req.user.createdAt
  });
});

// @route   PUT /api/auth/password
router.put('/password', [
  protect,
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 12 }).withMessage('New password must be at least 12 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { currentPassword, newPassword } = req.body;

  try {
    // Get user with password field
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/auth/email
router.put('/email', [
  protect,
  body('email').isEmail().withMessage('Please enter a valid email address')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is already taken by another user
    if (email) {
      const emailExists = await User.findOne({ email, _id: { $ne: req.user._id } });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Update email and reset verification status
    user.email = email;
    user.emailVerified = false;

    // Generate verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Send verification email
    try {
      await sendVerificationEmail(user, verificationToken);
      res.json({
        message: 'Email updated successfully. Please check your inbox to verify your email.',
        email: user.email,
        emailVerified: user.emailVerified
      });
    } catch (emailError) {
      // Email updated but verification email failed to send
      console.error('Failed to send verification email:', emailError);
      res.json({
        message: 'Email updated but verification email failed to send. Please try again later.',
        email: user.email,
        emailVerified: user.emailVerified
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/auth/verify-email/:token
router.get('/verify-email/:token', async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    // Mark email as verified
    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    // Send welcome email
    await sendWelcomeEmail(user);

    res.json({ message: 'Email verified successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/auth/resend-verification
router.post('/resend-verification', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    if (!user.email) {
      return res.status(400).json({ message: 'No email address set' });
    }

    // Generate new verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Send verification email
    await sendVerificationEmail(user, verificationToken);

    res.json({ message: 'Verification email sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/auth/notifications
router.put('/notifications', protect, async (req, res) => {
  try {
    const { emailNotifications } = req.body;

    if (typeof emailNotifications !== 'boolean') {
      return res.status(400).json({ message: 'emailNotifications must be a boolean value' });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.emailNotifications = emailNotifications;
    await user.save();

    res.json({
      message: 'Notification preferences updated successfully',
      emailNotifications: user.emailNotifications
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/auth/revenue
router.put('/revenue', [
  protect,
  body('monthlyRevenue').optional().isFloat({ min: 0 }).withMessage('Monthly revenue must be a positive number'),
  body('annualRevenue').optional().isFloat({ min: 0 }).withMessage('Annual revenue must be a positive number')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { monthlyRevenue, annualRevenue } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update revenue fields if provided
    if (monthlyRevenue !== undefined) {
      user.monthlyRevenue = monthlyRevenue;
    }
    if (annualRevenue !== undefined) {
      user.annualRevenue = annualRevenue;
    }

    await user.save();

    res.json({
      message: 'Revenue updated successfully',
      monthlyRevenue: user.monthlyRevenue,
      annualRevenue: user.annualRevenue
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;