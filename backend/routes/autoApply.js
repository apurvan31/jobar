// routes/autoApply.js — Auto-apply queue system
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Application = require('../models/Application');
const Job = require('../models/Job');
const { protect } = require('../middleware/auth');
const logger = require('../utils/logger');

// In-memory queue map (per user). Use Bull+Redis in production for scalability.
const userQueues = new Map();

// ---- Helper: simulate an apply attempt with multi-step progress ----
async function simulateApply(job, userId, io) {
  const steps = [
    'Reading job details...',
    'Tailoring resume with AI...',
    'Checking for questionnaire...',
    'Finalizing application...'
  ];

  for (const step of steps) {
    if (io) {
      io.to(`user:${userId}`).emit('autoapply-progress', {
        jobId: job._id,
        company: job.company,
        status: 'processing',
        message: step,
      });
    }
    
    // Artificial delay
    await new Promise(r => setTimeout(r, 600 + Math.random() * 600));

    // Simulation: 15% of jobs require additional info/questionnaire
    if (step === 'Checking for questionnaire...' && Math.random() < 0.15) {
      return 'requires-details';
    }
  }

  // 90% final success rate for the remaining
  return Math.random() > 0.05 ? 'success' : 'failed';
}

// ---- POST /api/autoapply/start ----
router.post('/start', protect, [
  body('jobIds').isArray({ min: 1, max: 50 }).withMessage('Provide 1–50 job IDs'),
  body('jobIds.*').isMongoId(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });

    const { jobIds } = req.body;
    const userId = req.user._id.toString();
    const io = req.app.get('io');

    // Prevent double-run
    if (userQueues.get(userId) === 'running') {
      return res.status(409).json({ error: 'Auto-apply already running for this user' });
    }

    userQueues.set(userId, 'running');
    let applied = 0, failed = 0, skipped = 0;

    res.json({ message: `Starting auto-apply for ${jobIds.length} jobs...`, total: jobIds.length });

    // Process asynchronously after responding
    (async () => {
      for (const jobId of jobIds) {
        try {
          const job = await Job.findById(jobId);
          if (!job) { skipped++; continue; }

          // Check if already applied
          const exists = await Application.findOne({ user: req.user._id, job: jobId });
          if (exists) { skipped++; continue; }

          if (io) {
            io.to(`user:${userId}`).emit('autoapply-progress', {
              jobId, company: job.company, role: job.title, status: 'processing',
            });
          }

          const result = await simulateApply(job, userId, io);
          const isSuccess = result === 'success';
          const isRequiresDetails = result === 'requires-details';

          const application = await Application.create({
            user: req.user._id,
            job: job._id,
            company: job.company,
            role: job.title,
            applyUrl: job.applyUrl,
            platform: job.platform,
            status: isRequiresDetails ? 'requires-details' : 'applied',
            isAutoApplied: true,
            autoApplyStatus: result,
            autoApplyError: isSuccess || isRequiresDetails ? undefined : 'ATS bot detection',
            companyColor: job.companyColor,
            companyEmoji: job.companyEmoji,
            notes: isRequiresDetails ? 'Questionnaire required by company.' : 'Auto-applied via job.bar AI engine',
            statusHistory: [{ status: isRequiresDetails ? 'requires-details' : 'applied', date: new Date() }],
          });

          if (isSuccess) applied++; 
          else if (isRequiresDetails) skipped++; // Group with skipped for now
          else failed++;

          if (io) {
            io.to(`user:${userId}`).emit('autoapply-progress', {
              jobId, 
              company: job.company, 
              role: job.title,
              status: result,
              message: isRequiresDetails ? 'Needs additional info' : (isSuccess ? 'Applied successfully' : 'Application failed'),
              applicationId: application._id,
            });
          }
        } catch (err) {
          logger.error(`AutoApply error for job ${jobId}: ${err.message}`);
          failed++;
        }
      }

      userQueues.set(userId, 'idle');

      if (io) {
        io.to(`user:${userId}`).emit('autoapply-complete', {
          applied, failed, skipped,
          message: `Done! Applied to ${applied} jobs. ${failed} failed, ${skipped} skipped.`,
        });
      }

      logger.info(`AutoApply complete for ${userId}: applied=${applied}, failed=${failed}, skipped=${skipped}`);
    })();

  } catch (err) {
    next(err);
  }
});

// ---- GET /api/autoapply/status ----
router.get('/status', protect, async (req, res) => {
  const userId = req.user._id.toString();
  const status = userQueues.get(userId) || 'idle';
  res.json({ status });
});

// ---- GET /api/autoapply/history ----
router.get('/history', protect, async (req, res, next) => {
  try {
    const applications = await Application.find({
      user: req.user._id,
      isAutoApplied: true,
    }).sort({ createdAt: -1 }).limit(100);

    const stats = {
      total: applications.length,
      success: applications.filter(a => a.autoApplyStatus === 'success').length,
      failed: applications.filter(a => a.autoApplyStatus === 'failed').length,
    };

    res.json({ applications, stats });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
