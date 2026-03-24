// routes/admin.js — Admin dashboard routes
const express = require('express');
const router = express.Router();
const { protect, requireAdmin } = require('../middleware/auth');
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Resume = require('../models/Resume');
const Analytics = require('../models/Analytics');

// All admin routes require auth + admin role
router.use(protect, requireAdmin);

// ---- GET /api/admin/stats ----
router.get('/stats', async (req, res, next) => {
  try {
    const [
      totalUsers, totalJobs, totalApplications, totalResumes,
      recentUsers, recentLogins, popularJobs,
    ] = await Promise.all([
      User.countDocuments(),
      Job.countDocuments({ isActive: true }),
      Application.countDocuments(),
      Resume.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(10).select('name email createdAt lastLogin role'),
      Analytics.countDocuments({ type: 'login', timestamp: { $gte: new Date(Date.now() - 86400000) } }),
      Job.find({ isActive: true }).sort({ views: -1 }).limit(5).select('title company views applications'),
    ]);

    // Daily signups last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
    const dailySignups = await Analytics.aggregate([
      { $match: { type: 'signup', timestamp: { $gte: sevenDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      stats: { totalUsers, totalJobs, totalApplications, totalResumes, recentLogins },
      recentUsers,
      popularJobs,
      dailySignups,
    });
  } catch (err) {
    next(err);
  }
});

// ---- GET /api/admin/users ----
router.get('/users', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .select('-password -activityLog'),
      User.countDocuments(filter),
    ]);

    res.json({ users, total, page: parseInt(page) });
  } catch (err) {
    next(err);
  }
});

// ---- GET /api/admin/analytics ----
router.get('/analytics', async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const since = new Date(Date.now() - days * 86400000);

    const byType = await Analytics.aggregate([
      { $match: { timestamp: { $gte: since } } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    const daily = await Analytics.aggregate([
      { $match: { timestamp: { $gte: since } } },
      {
        $group: {
          _id: { date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }, type: '$type' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    res.json({ byType, daily });
  } catch (err) {
    next(err);
  }
});

// ---- POST /api/admin/jobs (seed jobs) ----
router.post('/jobs', async (req, res, next) => {
  try {
    const { jobs } = req.body;
    if (!Array.isArray(jobs)) return res.status(400).json({ error: 'jobs array required' });
    const inserted = await Job.insertMany(jobs, { ordered: false });
    res.status(201).json({ message: `Inserted ${inserted.length} jobs` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
