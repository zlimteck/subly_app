import express from 'express';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import Invitation from '../models/Invitation.js';
import { protect } from '../middleware/auth.js';
import { adminOnly } from '../middleware/admin.js';

const router = express.Router();

// Rate limiter for invitation validation (public endpoint)
const validateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 validation attempts per hour
  message: 'Too many invitation validation attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// @route   POST /api/invitations/validate
router.post('/validate', validateLimiter, [
  body('code').trim().notEmpty().withMessage('Invitation code is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { code } = req.body;

  try {
    const invitation = await Invitation.findOne({ code: code.toUpperCase() });

    if (!invitation) {
      return res.status(404).json({ message: 'Invalid invitation code' });
    }

    const validation = invitation.isValid();
    if (!validation.valid) {
      return res.status(400).json({ message: validation.reason });
    }

    res.json({ message: 'Invitation code is valid' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/invitations/generate
router.post('/generate', [
  protect,
  adminOnly,
  body('count').optional().isInt({ min: 1, max: 100 }).withMessage('Count must be between 1 and 100'),
  body('expiresInDays').optional().isInt({ min: 1, max: 365 }).withMessage('Expiration must be between 1 and 365 days'),
  body('note').optional().trim().isLength({ max: 200 }).withMessage('Note must be less than 200 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { count = 1, expiresInDays = null, note = '' } = req.body;

  try {
    const invitations = [];
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    for (let i = 0; i < count; i++) {
      let code;
      let isUnique = false;

      // Generate unique code
      while (!isUnique) {
        code = Invitation.generateCode();
        const existing = await Invitation.findOne({ code });
        if (!existing) {
          isUnique = true;
        }
      }

      const invitation = await Invitation.create({
        code,
        createdBy: req.user._id,
        expiresAt,
        note
      });

      invitations.push({
        code: invitation.code,
        expiresAt: invitation.expiresAt,
        note: invitation.note,
        createdAt: invitation.createdAt
      });
    }

    res.status(201).json({
      message: `Successfully generated ${count} invitation code${count > 1 ? 's' : ''}`,
      invitations
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/invitations
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const invitations = await Invitation.find()
      .populate('usedBy', 'username')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });

    // Calculate stats
    const stats = {
      total: invitations.length,
      active: invitations.filter(inv => !inv.isUsed && (!inv.expiresAt || inv.expiresAt > new Date())).length,
      used: invitations.filter(inv => inv.isUsed).length,
      expired: invitations.filter(inv => !inv.isUsed && inv.expiresAt && inv.expiresAt < new Date()).length
    };

    res.json({ invitations, stats });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/invitations/:code
router.delete('/:code', protect, adminOnly, async (req, res) => {
  try {
    const invitation = await Invitation.findOne({ code: req.params.code.toUpperCase() });

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation code not found' });
    }

    if (invitation.isUsed) {
      return res.status(400).json({ message: 'Cannot delete used invitation codes' });
    }

    await invitation.deleteOne();

    res.json({ message: 'Invitation code revoked successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;