// models/Analytics.js
const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['page_visit', 'login', 'signup', 'job_view', 'job_apply', 'resume_upload', 'ai_used', 'autoapply'],
    required: true,
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // null = anonymous
  ip: String,
  userAgent: String,
  path: String,
  method: String,
  detail: mongoose.Schema.Types.Mixed,
  sessionId: String,
  country: String,
  referrer: String,
  timestamp: { type: Date, default: Date.now },
}, { timestamps: false });

analyticsSchema.index({ type: 1, timestamp: -1 });
analyticsSchema.index({ user: 1, timestamp: -1 });
analyticsSchema.index({ timestamp: -1 });

const Analytics = mongoose.model('Analytics', analyticsSchema);
module.exports = Analytics;
