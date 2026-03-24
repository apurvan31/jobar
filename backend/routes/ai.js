// routes/ai.js — OpenAI-powered features
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const aiService = require('../services/aiService');
const Resume = require('../models/Resume');
const Analytics = require('../models/Analytics');
const logger = require('../utils/logger');

// ---- POST /api/ai/optimize-resume ----
router.post('/optimize-resume', protect, [
  body('jobDescription').notEmpty().withMessage('Job description is required'),
  body('resumeId').optional().isMongoId(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });

    const { jobDescription, resumeId } = req.body;

    let resumeText = '';
    if (resumeId) {
      const resume = await Resume.findOne({ _id: resumeId, user: req.user._id });
      if (resume) resumeText = resume.rawText || JSON.stringify(resume.parsedData);
    } else {
      // Use user skills as fallback
      resumeText = `Skills: ${(req.user.skills || []).join(', ')}. Title: ${req.user.jobTitle || 'Developer'}`;
    }

    const result = await aiService.optimizeResume(resumeText, jobDescription);

    await Analytics.create({ type: 'ai_used', user: req.user._id, detail: { feature: 'optimize-resume' } });
    res.json({ result });
  } catch (err) {
    next(err);
  }
});

// ---- POST /api/ai/cover-letter ----
router.post('/cover-letter', protect, [
  body('company').trim().notEmpty(),
  body('role').trim().notEmpty(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });

    const { company, role, jobDescription = '', tone = 'Professional', resumeId } = req.body;

    let skillsSummary = (req.user.skills || []).join(', ');
    let experience = `${req.user.yearsOfExperience || 2}+ years`;
    let name = req.user.name;

    if (resumeId) {
      const resume = await Resume.findOne({ _id: resumeId, user: req.user._id });
      if (resume?.parsedData) {
        skillsSummary = resume.parsedData.skills?.join(', ') || skillsSummary;
      }
    }

    const coverLetter = await aiService.generateCoverLetter({
      name, company, role, jobDescription, tone, skillsSummary, experience,
    });

    await Analytics.create({ type: 'ai_used', user: req.user._id, detail: { feature: 'cover-letter', company, role } });
    res.json({ coverLetter });
  } catch (err) {
    next(err);
  }
});

// ---- POST /api/ai/interview-prep ----
router.post('/interview-prep', protect, [
  body('role').trim().notEmpty(),
  body('company').trim().notEmpty(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });

    const { role, company, jobDescription = '', difficulty = 'medium' } = req.body;
    const skills = (req.user.skills || []).join(', ');

    const prep = await aiService.generateInterviewPrep({ role, company, jobDescription, skills, difficulty });

    await Analytics.create({ type: 'ai_used', user: req.user._id, detail: { feature: 'interview-prep', role, company } });
    res.json({ prep });
  } catch (err) {
    next(err);
  }
});

// ---- POST /api/ai/match-jobs ----
router.post('/match-jobs', protect, async (req, res, next) => {
  try {
    const Job = require('../models/Job');
    const userSkills = req.user.skills || [];
    const userTitle = req.user.jobTitle || '';

    if (userSkills.length === 0) {
      return res.status(400).json({ error: 'Please add skills to your profile first' });
    }

    const jobs = await Job.find({ isActive: true }).limit(50).lean();

    const scored = jobs.map(job => {
      const jobSkills = job.skills || [];
      const matching = jobSkills.filter(s =>
        userSkills.some(us => us.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(us.toLowerCase()))
      );
      const score = jobSkills.length > 0 ? Math.round((matching.length / jobSkills.length) * 100) : 50;
      return { ...job, matchScore: Math.min(99, score + Math.floor(Math.random() * 10)), matchingSkills: matching };
    }).sort((a, b) => b.matchScore - a.matchScore).slice(0, 20);

    res.json({ jobs: scored });
  } catch (err) {
    next(err);
  }
});

// ---- POST /api/ai/chat ----
router.post('/chat', protect, [
  body('message').trim().notEmpty().isLength({ max: 2000 }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });

    const { message, history = [] } = req.body;
    const userContext = {
      name: req.user.name,
      skills: (req.user.skills || []).join(', '),
      jobTitle: req.user.jobTitle || 'Job Seeker',
      yearsOfExperience: req.user.yearsOfExperience || 0,
    };

    const reply = await aiService.chat(message, history, userContext);

    await Analytics.create({ type: 'ai_used', user: req.user._id, detail: { feature: 'chat' } });
    res.json({ reply });
  } catch (err) {
    next(err);
  }
});

// ---- POST /api/ai/analyze-job ----
router.post('/analyze-job', protect, [
  body('jobId').isMongoId(),
], async (req, res, next) => {
  try {
    const Job = require('../models/Job');
    const { jobId } = req.body;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const userSkills = req.user.skills || [];
    const jobSkills = job.skills || [];

    const matchingSkills = jobSkills.filter(s =>
      userSkills.some(us => us.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(us.toLowerCase()))
    );
    const missingSkills = jobSkills.filter(s => !matchingSkills.includes(s));
    const matchScore = jobSkills.length > 0
      ? Math.min(99, Math.round((matchingSkills.length / jobSkills.length) * 100) + 5)
      : 60;

    const analysis = await aiService.analyzeJobFit({
      jobTitle: job.title,
      company: job.company,
      jobDescription: job.description,
      requiredSkills: jobSkills,
      userSkills,
      matchingSkills,
      missingSkills,
      matchScore,
    });

    res.json({ analysis, matchScore, matchingSkills, missingSkills });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
