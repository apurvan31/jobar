// routes/users.js — User profile routes
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Application = require('../models/Application');
const SavedJob = require('../models/SavedJob');
const Analytics = require('../models/Analytics');
const { protect } = require('../middleware/auth');

// ---- GET /api/users/profile ----
router.get('/profile', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -activityLog')
      .populate('activeResume', 'label filename parsedData.skills atsScore');

    const appCount = await Application.countDocuments({ user: req.user._id });
    const savedCount = await SavedJob.countDocuments({ user: req.user._id });

    res.json({
      user,
      stats: {
        applications: appCount,
        savedJobs: savedCount,
        profileViews: user.profileViews,
        loginCount: user.loginCount,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ---- PUT /api/users/profile ----
router.put('/profile', protect, [
  body('name').optional().trim().notEmpty().isLength({ max: 100 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().isString(),
  body('skills').optional().isArray(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const allowedFields = [
      'name', 'phone', 'location', 'linkedin', 'portfolio', 'github',
      'jobTitle', 'about', 'skills', 'expectedSalary', 'yearsOfExperience',
      'noticePeriod', 'workAuth', 'willingToRelocate', 'visaSponsorship',
      'graduationYear', 'gender', 'coverLetterTemplate', 'preferences',
    ];

    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -activityLog');

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Update avatar initials if name changed
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${req.user._id}`).emit('profile-updated', { name: user.name });
    }

    res.json({ message: 'Profile updated!', user });
  } catch (err) {
    next(err);
  }
});

// ---- PUT /api/users/password ----
router.put('/password', protect, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user.password) {
      return res.status(400).json({ error: 'Google OAuth accounts cannot change password here' });
    }

    const isMatch = await user.comparePassword(req.body.currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    user.password = req.body.newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
});

// ---- GET /api/users/activity ----
router.get('/activity', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('activityLog');
    res.json({ activity: user.activityLog.slice(-50).reverse() });
  } catch (err) {
    next(err);
  }
});

// ---- GET /api/users/dashboard-stats ----
router.get('/dashboard-stats', protect, async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [totalApps, statusCounts, savedCount] = await Promise.all([
      Application.countDocuments({ user: userId }),
      Application.aggregate([
        { $match: { user: userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      SavedJob.countDocuments({ user: userId }),
    ]);

    const statusMap = {};
    statusCounts.forEach(s => { statusMap[s._id] = s.count; });

    res.json({
      stats: {
        totalApplications: totalApps,
        savedJobs: savedCount,
        applied: statusMap.applied || 0,
        viewed: statusMap.viewed || 0,
        shortlisted: statusMap.shortlisted || 0,
        interview: statusMap.interview || 0,
        offer: statusMap.offer || 0,
        rejected: statusMap.rejected || 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
