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

// ---- Helper: simulate an apply attempt ----
async function simulateApply(job) {
  await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));
  // 90% success rate simulation
  const success = Math.random() > 0.1;
  return success;
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

          const success = await simulateApply(job);

          const application = await Application.create({
            user: req.user._id,
            job: job._id,
            company: job.company,
            role: job.title,
            applyUrl: job.applyUrl,
            platform: job.platform,
            status: success ? 'applied' : 'applied',
            isAutoApplied: true,
            autoApplyStatus: success ? 'success' : 'failed',
            autoApplyError: success ? undefined : 'ATS bot detection',
            companyColor: job.companyColor,
            companyEmoji: job.companyEmoji,
            notes: `Auto-applied via job.bar AI engine`,
            statusHistory: [{ status: 'applied', date: new Date() }],
          });

          if (success) applied++; else failed++;

          if (io) {
            io.to(`user:${userId}`).emit('autoapply-progress', {
              jobId, company: job.company, role: job.title,
              status: success ? 'success' : 'failed',
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
