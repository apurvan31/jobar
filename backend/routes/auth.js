// routes/auth.js — Authentication routes
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');
const Analytics = require('../models/Analytics');
const { protect } = require('../middleware/auth');
const logger = require('../utils/logger');

// ---- Helper: generate tokens ----
const generateTokens = (userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });
  return { token, refreshToken };
};

// ---- POST /api/auth/signup ----
router.post('/signup', [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered. Please sign in.' });
    }

    const user = await User.create({ name, email, password });

    // Track signup
    await Analytics.create({
      type: 'signup', user: user._id,
      ip: req.ip, userAgent: req.headers['user-agent'],
    });

    const { token, refreshToken } = generateTokens(user._id);

    logger.info(`New user signed up: ${email}`);
    res.status(201).json({
      message: 'Account created successfully!',
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ---- POST /api/auth/login ----
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.password) {
      return res.status(401).json({ error: 'Please sign in with Google (this account uses Google OAuth)' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    // Track login
    await Analytics.create({
      type: 'login', user: user._id,
      ip: req.ip, userAgent: req.headers['user-agent'],
    });

    const { token, refreshToken } = generateTokens(user._id);

    logger.info(`User logged in: ${email}`);
    res.json({
      message: 'Signed in successfully!',
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        jobTitle: user.jobTitle,
        skills: user.skills,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ---- POST /api/auth/logout ----
router.post('/logout', protect, async (req, res) => {
  // In stateless JWT, just confirm. Client should clear the token.
  // For refresh token invalidation, use a blocklist (Redis).
  res.json({ message: 'Logged out successfully' });
});

// ---- POST /api/auth/refresh ----
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: 'Refresh token required' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ error: 'User not found' });

    const { token, refreshToken: newRefresh } = generateTokens(user._id);
    res.json({ token, refreshToken: newRefresh });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Refresh token expired. Please log in again.' });
    }
    next(err);
  }
});

// ---- GET /api/auth/me ----
router.get('/me', protect, async (req, res) => {
  res.json({ user: req.user });
});

// ---- POST /api/auth/forgot-password ----
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail(),
], async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always return success (security best practice)
    res.json({ message: 'If that email exists, a reset link has been sent.' });

    if (user) {
      logger.info(`Password reset requested for: ${email}`);
      // TODO: send actual email with nodemailer
    }
  } catch (err) {
    next(err);
  }
});

// ---- GET /api/auth/google ----
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
}));

// ---- GET /api/auth/google/callback ----
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}?auth=failed` }),
  async (req, res) => {
    const user = req.user;
    const { token, refreshToken } = generateTokens(user._id);

    await Analytics.create({
      type: 'login', user: user._id,
      ip: req.ip, userAgent: req.headers['user-agent'],
      detail: { method: 'google' },
    });

    // Redirect to frontend with token in URL (frontend can extract and store)
    res.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:5500'}?token=${token}&refreshToken=${refreshToken}&userId=${user._id}`
    );
  }
);

module.exports = router;
