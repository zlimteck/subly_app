import express from 'express';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

// @route   GET /api/admin/users
// @desc    Get all users with pagination and search
// @access  Admin
router.get('/users', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const includeDeleted = req.query.includeDeleted === 'true';

    // Build query
    const query = {};

    // Exclude current admin user from the list
    query._id = { $ne: req.user._id };

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (!includeDeleted) {
      query.isDeleted = { $ne: true };
    }

    // Get total count for pagination
    const total = await User.countDocuments(query);

    // Get users
    const users = await User.find(query)
      .select('-password -emailVerificationToken')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Get subscription count for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const subscriptionCount = await Subscription.countDocuments({ user: user._id });
        const totalMonthly = await Subscription.aggregate([
          { $match: { user: user._id, isActive: true } },
          {
            $project: {
              monthlyCost: {
                $cond: {
                  if: { $eq: ['$billingCycle', 'monthly'] },
                  then: '$amount',
                  else: { $divide: ['$amount', 12] }
                }
              }
            }
          },
          { $group: { _id: null, total: { $sum: '$monthlyCost' } } }
        ]);

        return {
          ...user,
          subscriptionCount,
          totalMonthlySpend: totalMonthly[0]?.total || 0
        };
      })
    );

    res.json({
      users: usersWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/users/:id/soft-delete
// @desc    Soft delete a user (mark as deleted)
// @access  Admin
router.put('/users/:id/soft-delete', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    // Check if already deleted
    if (user.isDeleted) {
      return res.status(400).json({ message: 'User is already deleted' });
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    await user.save();

    console.log(`🔒 User soft-deleted: ${user.username} by admin: ${req.user.username}`);

    res.json({ message: 'User deactivated successfully', user: { _id: user._id, username: user.username } });
  } catch (error) {
    console.error('Error soft-deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/users/:id/restore
// @desc    Restore a soft-deleted user
// @access  Admin
router.put('/users/:id/restore', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isDeleted) {
      return res.status(400).json({ message: 'User is not deleted' });
    }

    user.isDeleted = false;
    user.deletedAt = null;
    await user.save();

    console.log(`✅ User restored: ${user.username} by admin: ${req.user.username}`);

    res.json({ message: 'User restored successfully', user: { _id: user._id, username: user.username } });
  } catch (error) {
    console.error('Error restoring user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Hard delete a user (permanent)
// @access  Admin
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const username = user.username;

    // Delete all user's subscriptions
    await Subscription.deleteMany({ user: user._id });

    // Delete user
    await user.deleteOne();

    console.log(`🗑️ User hard-deleted: ${username} by admin: ${req.user.username}`);

    res.json({ message: 'User and all associated data permanently deleted' });
  } catch (error) {
    console.error('Error hard-deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/stats
// @desc    Get admin dashboard stats
// @access  Admin
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ isDeleted: false });
    const totalDeletedUsers = await User.countDocuments({ isDeleted: true });
    const totalSubscriptions = await Subscription.countDocuments();
    const activeSubscriptions = await Subscription.countDocuments({ isActive: true });

    res.json({
      totalUsers,
      totalDeletedUsers,
      totalSubscriptions,
      activeSubscriptions
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;