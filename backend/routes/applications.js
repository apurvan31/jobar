// routes/applications.js — Application tracking CRUD
const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const Application = require('../models/Application');
const Job = require('../models/Job');
const Analytics = require('../models/Analytics');
const { protect } = require('../middleware/auth');

// ---- GET /api/applications ----
router.get('/', protect, async (req, res, next) => {
  try {
    const { status, sort = 'lastUpdated', page = 1, limit = 50 } = req.query;
    const filter = { user: req.user._id };
    if (status && status !== 'all') filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortMap = {
      lastUpdated: { lastUpdated: -1 },
      appliedDate: { appliedDate: -1 },
      company: { company: 1 },
    };

    const [applications, total] = await Promise.all([
      Application.find(filter)
        .sort(sortMap[sort] || { lastUpdated: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('resumeUsed', 'label filename'),
      Application.countDocuments(filter),
    ]);

    // Pipeline stats
    const pipeline = await Application.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const stats = {};
    pipeline.forEach(p => { stats[p._id] = p.count; });

    res.json({ applications, total, stats });
  } catch (err) {
    next(err);
  }
});

// ---- POST /api/applications ----
router.post('/', protect, [
  body('company').trim().notEmpty().withMessage('Company is required'),
  body('role').trim().notEmpty().withMessage('Role is required'),
  body('applyUrl').optional().isURL(),
  body('status').optional().isIn(['applied', 'saved', 'viewed', 'shortlisted', 'interview', 'offer', 'rejected']),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { company, role, applyUrl, platform, status = 'applied', notes, jobId } = req.body;

    // Check duplicate
    const existing = await Application.findOne({
      user: req.user._id,
      company: { $regex: `^${company}$`, $options: 'i' },
      role: { $regex: `^${role}$`, $options: 'i' },
    });

    if (existing) {
      return res.status(409).json({ error: 'Application already tracked for this role', application: existing });
    }

    const application = await Application.create({
      user: req.user._id,
      job: jobId || undefined,
      company,
      role,
      applyUrl,
      platform,
      status,
      notes,
      companyColor: `hsl(${Math.floor(Math.random() * 360)}, 70%, 45%)`,
      companyEmoji: company[0].toUpperCase(),
      statusHistory: [{ status, date: new Date() }],
    });

    // Increment job application count
    if (jobId) {
      await Job.findByIdAndUpdate(jobId, { $inc: { applications: 1 } });
    }

    await Analytics.create({
      type: 'job_apply', user: req.user._id,
      detail: { company, role, status, platform },
    });

    // Real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${req.user._id}`).emit('application-added', {
        application,
        message: `Application tracked: ${role} at ${company}`,
      });
    }

    res.status(201).json({ message: 'Application tracked!', application });
  } catch (err) {
    next(err);
  }
});

// ---- PUT /api/applications/:id ----
router.put('/:id', protect, [
  param('id').isMongoId(),
  body('status').optional().isIn(['applied', 'saved', 'viewed', 'shortlisted', 'interview', 'offer', 'rejected', 'withdrawn']),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const application = await Application.findOne({ _id: req.params.id, user: req.user._id });
    if (!application) return res.status(404).json({ error: 'Application not found' });

    const allowedUpdates = ['status', 'notes', 'salary', 'interviewDate', 'offerDate'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) application[field] = req.body[field];
    });

    await application.save();

    // Real-time status update
    const io = req.app.get('io');
    if (io && req.body.status) {
      io.to(`user:${req.user._id}`).emit('application-status-updated', {
        applicationId: application._id,
        status: application.status,
        company: application.company,
        role: application.role,
      });
    }

    res.json({ message: 'Application updated!', application });
  } catch (err) {
    next(err);
  }
});

// ---- DELETE /api/applications/:id ----
router.delete('/:id', protect, [param('id').isMongoId()], async (req, res, next) => {
  try {
    const application = await Application.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!application) return res.status(404).json({ error: 'Application not found' });
    res.json({ message: 'Application removed' });
  } catch (err) {
    next(err);
  }
});

// ---- GET /api/applications/export ----
router.get('/export/csv', protect, async (req, res, next) => {
  try {
    const applications = await Application.find({ user: req.user._id }).sort({ appliedDate: -1 });

    const rows = [
      ['Company', 'Role', 'Status', 'Applied Date', 'URL', 'Notes'],
      ...applications.map(a => [
        a.company, a.role, a.status,
        new Date(a.appliedDate).toLocaleDateString(),
        a.applyUrl || '', a.notes || '',
      ]),
    ];

    const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=applications.csv');
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
