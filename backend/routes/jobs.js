// routes/jobs.js — Job CRUD + search + external fetch
const express = require('express');
const router = express.Router();
const { query, param, validationResult } = require('express-validator');
const Job = require('../models/Job');
const SavedJob = require('../models/SavedJob');
const Analytics = require('../models/Analytics');
const { protect, optionalAuth } = require('../middleware/auth');
const jobFetcher = require('../services/jobFetcher');
const logger = require('../utils/logger');

// ---- GET /api/jobs ----
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const {
      search, role, expLevel, mode, location, platform,
      sort = 'recent', page = 1, limit = 30,
    } = req.query;

    const filter = { isActive: true };

    if (search) {
      filter.$text = { $search: search };
    }
    if (role) filter.type = { $regex: role, $options: 'i' };
    if (expLevel) filter.expLevel = expLevel;
    if (mode) filter.mode = mode;
    if (platform) filter.platform = platform;
    if (location && location !== 'remote') {
      filter.location = { $regex: location, $options: 'i' };
    }
    if (location === 'remote') {
      filter.mode = 'remote';
    }

    const sortMap = {
      recent: { postedAt: -1 },
      match: { isFeatured: -1, views: -1 },
      salary: { salaryMax: -1 },
      company: { company: 1 },
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .sort(sortMap[sort] || { postedAt: -1 })
        .skip(skip)
        .limit(Math.min(parseInt(limit), 100))
        .lean(),
      Job.countDocuments(filter),
    ]);

    // If logged in, add match score based on user skills
    let processedJobs = jobs;
    if (req.user) {
      const userSkills = req.user.skills || [];
      processedJobs = jobs.map(job => {
        const jobSkills = job.skills || [];
        const matchingSkills = jobSkills.filter(s =>
          userSkills.some(us => us.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(us.toLowerCase()))
        );
        const matchScore = jobSkills.length > 0
          ? Math.min(95, Math.round((matchingSkills.length / jobSkills.length) * 100) + Math.floor(Math.random() * 10))
          : Math.floor(Math.random() * 40) + 50;
        return { ...job, matchScore };
      });
    } else {
      processedJobs = jobs.map(job => ({
        ...job,
        matchScore: Math.floor(Math.random() * 40) + 55,
      }));
    }

    res.json({
      jobs: processedJobs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ---- GET /api/jobs/fetch-live ----
// Trigger a live fetch from external APIs
router.post('/fetch-live', protect, async (req, res, next) => {
  try {
    const { query: searchQuery = 'software engineer', location = 'india' } = req.body;
    const newJobs = await jobFetcher.fetchFromRapidAPI(searchQuery, location);

    logger.info(`Fetched ${newJobs.length} live jobs`);
    res.json({
      message: `Fetched ${newJobs.length} new jobs`,
      count: newJobs.length,
    });
  } catch (err) {
    logger.error(`Live job fetch failed: ${err.message}`);
    res.status(200).json({ message: 'Live fetch unavailable, showing cached jobs', count: 0 });
  }
});

// ---- GET /api/jobs/:id ----
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).lean();
    if (!job) return res.status(404).json({ error: 'Job not found' });

    // Track view
    await Job.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    if (req.user) {
      await Analytics.create({
        type: 'job_view', user: req.user._id,
        detail: { jobId: job._id, company: job.company, role: job.title },
      });
    }

    // Check if saved
    let isSaved = false;
    if (req.user) {
      const saved = await SavedJob.findOne({ user: req.user._id, job: job._id });
      isSaved = !!saved;
    }

    res.json({ job: { ...job, isSaved } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
