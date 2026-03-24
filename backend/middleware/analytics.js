// middleware/analytics.js — Request tracking middleware
const Analytics = require('../models/Analytics');

const trackVisit = async (req, res, next) => {
  // Skip health checks, static files, and OPTIONS
  if (
    req.method === 'OPTIONS' ||
    req.path === '/api/health' ||
    req.path.startsWith('/uploads')
  ) return next();

  try {
    // Non-blocking — don't await
    Analytics.create({
      type: 'page_visit',
      user: req.user?._id || null,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      path: req.path,
      method: req.method,
      referrer: req.headers['referer'] || '',
    }).catch(() => {}); // Silently fail to not block requests
  } catch (_) {}

  next();
};

module.exports = { trackVisit };
