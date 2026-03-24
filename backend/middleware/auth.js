// middleware/auth.js — JWT protect + role guards
const passport = require('passport');

// Require authenticated user
const protect = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      const message = info?.name === 'TokenExpiredError' ? 'Token expired. Please log in again.' : 'Unauthorized. Please log in.';
      return res.status(401).json({ error: message });
    }
    req.user = user;
    next();
  })(req, res, next);
};

// Optional auth — attaches user if token provided, but doesn't block
const optionalAuth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (!err && user) req.user = user;
    next();
  })(req, res, next);
};

// Require admin role
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = { protect, optionalAuth, requireAdmin };
