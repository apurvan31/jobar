/* =============================================
   job.bar — Express + Socket.io Server Entry
   ============================================= */

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const path = require('path');
const passport = require('passport');

const connectDB = require('./config/db');
const logger = require('./utils/logger');
const { trackVisit } = require('./middleware/analytics');

// ---- Import Routes ----
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const jobRoutes = require('./routes/jobs');
const applicationRoutes = require('./routes/applications');
const resumeRoutes = require('./routes/resumes');
const aiRoutes = require('./routes/ai');
const savedJobRoutes = require('./routes/savedJobs');
const autoApplyRoutes = require('./routes/autoApply');
const adminRoutes = require('./routes/admin');
const newsRoutes = require('./routes/news'); // Added News Service

// ---- Connect Database ----
connectDB();

// ---- App Setup ----
const app = express();
const server = http.createServer(app);

// ---- Socket.io Setup ----
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible from routes
app.set('io', io);

// ---- Security Middleware ----
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));
app.use(mongoSanitize());

// ---- CORS ----
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://jobar-beryl.vercel.app',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:5173',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ---- Rate Limiting ----
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 500,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts. Please wait 15 minutes.' },
});

app.use(globalLimiter);

// ---- Body Parsers ----
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ---- Compression ----
app.use(compression());

// ---- Logging ----
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trim()) } }));
}

// ---- Passport ----
require('./config/passport')(passport);
app.use(passport.initialize());

// ---- Analytics Tracking ----
app.use(trackVisit);

// ---- Static Files (Uploads) ----
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---- Health Check ----
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
  });
});

// ---- API Routes ----
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/saved-jobs', savedJobRoutes);
app.use('/api/autoapply', autoApplyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/news', newsRoutes); // Active News Hub

// ---- 404 Handler ----
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

// ---- Global Error Handler ----
app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation failed', details: err.message });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ error: `${field} already exists` });
  }
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ---- Socket.io Events ----
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on('join-user-room', (userId) => {
    socket.join(`user:${userId}`);
    logger.info(`User ${userId} joined their room`);
  });

  socket.on('join-admin-room', () => {
    socket.join('admin');
  });

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// ---- Background Status Analyzer (Simulated ATS Feedback) ----
// In production, this would be triggered by webhooks from Greenhouse/Lever or Email Scraping.
setInterval(async () => {
  try {
    const Application = require('./models/Application');
    const apps = await Application.find({ status: 'applied' }).limit(5);
    
    for (const app of apps) {
      // 30% chance of status change
      if (Math.random() < 0.3) {
        const nextStatus = Math.random() < 0.8 ? 'viewed' : 'shortlisted';
        app.status = nextStatus;
        app.statusHistory.push({ status: nextStatus, date: new Date() });
        await app.save();

        const io = app.get('io') || app.constructor.parent?.get?.('io'); // Fallback check
        if (app && app.user) {
          const globalIo = app.constructor.model('User').db.base.models.User.db.base.io; // Access io via app container
          // Simple way: Access io from app context
          const currentIo = app.db.base.io;
          if (currentIo) {
            currentIo.to(`user:${app.user}`).emit('application-status-updated', {
              applicationId: app._id,
              company: app.company,
              status: nextStatus,
              message: `Your application at ${app.company} was just moved to: ${nextStatus}!`
            });
          }
        }
      }
    }
  } catch (err) {
    // Fail silently in background
  }
}, 60000 * 5); // Run every 5 minutes

// Export io for use in controllers
module.exports.io = io;
app.db = { base: { io } }; // Container for background processes to access io

// ---- Start Server ----
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`🚀 job.bar backend running on port ${PORT}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📡 Socket.io ready`);
});

module.exports = app;
