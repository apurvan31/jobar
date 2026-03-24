// routes/savedJobs.js — Save / unsave jobs
const express = require('express');
const router = express.Router();
const { param, validationResult } = require('express-validator');
const SavedJob = require('../models/SavedJob');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { protect } = require('../middleware/auth');

// ---- GET /api/saved-jobs ----
router.get('/', protect, async (req, res, next) => {
  try {
    const savedJobs = await SavedJob.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('job', 'title company companyColor companyEmoji location salary mode platform applyUrl skills postedAt isActive');
    res.json({ savedJobs, total: savedJobs.length });
  } catch (err) {
    next(err);
  }
});

// ---- POST /api/saved-jobs/:jobId ----
router.post('/:jobId', protect, [param('jobId').isMongoId()], async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const existing = await SavedJob.findOne({ user: req.user._id, job: job._id });
    if (existing) {
      return res.status(409).json({ error: 'Job already saved', savedJob: existing });
    }

    const savedJob = await SavedJob.create({
      user: req.user._id,
      job: job._id,
      company: job.company,
      role: job.title,
      companyColor: job.companyColor,
      companyEmoji: job.companyEmoji,
      platform: job.platform,
      location: job.location,
      salary: job.salary,
      mode: job.mode,
      applyUrl: job.applyUrl,
    });

    res.status(201).json({ message: 'Job saved!', savedJob });
  } catch (err) {
    next(err);
  }
});

// ---- DELETE /api/saved-jobs/:jobId ----
router.delete('/:jobId', protect, [param('jobId').isMongoId()], async (req, res, next) => {
  try {
    const deleted = await SavedJob.findOneAndDelete({ user: req.user._id, job: req.params.jobId });
    if (!deleted) return res.status(404).json({ error: 'Saved job not found' });
    res.json({ message: 'Job unsaved' });
  } catch (err) {
    next(err);
  }
});

// ---- POST /api/saved-jobs/auto-apply-all ----
router.post('/actions/auto-apply-all', protect, async (req, res, next) => {
  try {
    const savedJobs = await SavedJob.find({ user: req.user._id }).populate('job');
    let applied = 0;

    for (const sj of savedJobs) {
      if (!sj.job) continue;
      const exists = await Application.findOne({ user: req.user._id, job: sj.job._id });
      if (!exists) {
        await Application.create({
          user: req.user._id,
          job: sj.job._id,
          company: sj.company,
          role: sj.role,
          applyUrl: sj.applyUrl,
          platform: sj.platform,
          status: 'applied',
          isAutoApplied: true,
          autoApplyStatus: 'success',
          companyColor: sj.companyColor,
          companyEmoji: sj.companyEmoji,
        });
        applied++;
      }
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${req.user._id}`).emit('auto-apply-complete', {
        count: applied,
        message: `Auto-applied to ${applied} saved jobs!`,
      });
    }

    res.json({ message: `Applied to ${applied} jobs`, count: applied });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
