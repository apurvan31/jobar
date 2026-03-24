// models/Application.js
const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },

  // Job snapshot (in case job gets deleted)
  company: { type: String, required: true },
  role: { type: String, required: true },
  companyColor: { type: String, default: '#6366f1' },
  companyEmoji: { type: String, default: '🏢' },
  applyUrl: { type: String, default: '' },
  platform: { type: String, default: 'other' },

  // Status pipeline
  status: {
    type: String,
    enum: ['saved', 'applied', 'viewed', 'shortlisted', 'interview', 'offer', 'rejected', 'withdrawn'],
    default: 'applied',
  },

  // Dates
  appliedDate: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now },
  interviewDate: Date,
  offerDate: Date,
  rejectedDate: Date,

  // Details
  notes: { type: String, default: '' },
  coverLetterUsed: { type: String, default: '' },
  resumeUsed: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
  salary: { type: String, default: '' },

  // Auto Apply
  isAutoApplied: { type: Boolean, default: false },
  autoApplyStatus: {
    type: String,
    enum: ['pending', 'processing', 'success', 'failed', 'manual'],
    default: 'manual',
  },
  autoApplyError: String,

  // Status history
  statusHistory: [{
    status: String,
    date: { type: Date, default: Date.now },
    note: String,
  }],

}, { timestamps: true });

applicationSchema.index({ user: 1, status: 1 });
applicationSchema.index({ user: 1, appliedDate: -1 });

// Auto-update lastUpdated and statusHistory on status change
applicationSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.lastUpdated = new Date();
    this.statusHistory.push({ status: this.status, date: new Date() });
  }
  next();
});

const Application = mongoose.model('Application', applicationSchema);
module.exports = Application;
