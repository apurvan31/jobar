// routes/resumes.js — Resume upload, parsing, management
const express = require('express');
const router = express.Router();
const path = require('path');
const Resume = require('../models/Resume');
const User = require('../models/User');
const Analytics = require('../models/Analytics');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const resumeParser = require('../services/resumeParser');
const logger = require('../utils/logger');

// ---- GET /api/resumes ----
router.get('/', protect, async (req, res, next) => {
  try {
    const resumes = await Resume.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select('-rawText');
    res.json({ resumes });
  } catch (err) {
    next(err);
  }
});

// ---- POST /api/resumes/upload ----
router.post('/upload', protect, upload.single('resume'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Please provide a PDF or DOCX file.' });
    }

    const file = req.file;
    logger.info(`Resume upload: ${file.originalname} by user ${req.user._id}`);

    // Create resume record immediately
    const resume = await Resume.create({
      user: req.user._id,
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      filePath: file.path,
      label: req.body.label || file.originalname.replace(/\.[^.]+$/, ''),
    });

    // Parse asynchronously and update
    try {
      const parsed = await resumeParser.parse(file.path, file.mimetype);

      resume.parsedData = parsed;
      resume.rawText = parsed.rawText;
      resume.parsedAt = new Date();
      resume.atsScore = parsed.atsScore || 0;
      resume.completenessScore = parsed.completenessScore || 0;
      resume.suggestions = parsed.suggestions || [];
      await resume.save();

      // Auto-update user skills from resume
      if (parsed.skills && parsed.skills.length > 0) {
        await User.findByIdAndUpdate(req.user._id, {
          $set: {
            skills: parsed.skills,
            activeResume: resume._id,
          },
        });
      }

      // Emit real-time parse complete
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${req.user._id}`).emit('resume-parsed', {
          resumeId: resume._id,
          parsedData: parsed,
          message: 'Resume parsed successfully!',
        });
      }

    } catch (parseErr) {
      logger.warn(`Resume parse failed: ${parseErr.message}`);
      // Don't fail the upload, just log
    }

    await Analytics.create({
      type: 'resume_upload',
      user: req.user._id,
      detail: { filename: file.originalname, size: file.size },
    });

    res.status(201).json({
      message: 'Resume uploaded and processing...',
      resume: {
        id: resume._id,
        filename: resume.originalName,
        parsedData: resume.parsedData,
        atsScore: resume.atsScore,
        suggestions: resume.suggestions,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ---- GET /api/resumes/:id ----
router.get('/:id', protect, async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) return res.status(404).json({ error: 'Resume not found' });
    res.json({ resume });
  } catch (err) {
    next(err);
  }
});

// ---- PUT /api/resumes/:id/set-active ----
router.put('/:id/set-active', protect, async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) return res.status(404).json({ error: 'Resume not found' });

    // Deactivate all others
    await Resume.updateMany({ user: req.user._id }, { isActive: false });
    resume.isActive = true;
    await resume.save();

    await User.findByIdAndUpdate(req.user._id, { activeResume: resume._id });

    res.json({ message: 'Active resume updated', resume });
  } catch (err) {
    next(err);
  }
});

// ---- DELETE /api/resumes/:id ----
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const resume = await Resume.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!resume) return res.status(404).json({ error: 'Resume not found' });
    res.json({ message: 'Resume deleted' });
  } catch (err) {
    next(err);
  }
});

// ---- GET /api/resumes/:id/download ----
router.get('/:id/download', protect, async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) return res.status(404).json({ error: 'Resume not found' });
    res.download(resume.filePath, resume.originalName);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
