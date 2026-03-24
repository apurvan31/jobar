// models/Job.js
const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  // Core
  title: { type: String, required: true, trim: true },
  company: { type: String, required: true, trim: true },
  companyLogo: { type: String, default: '' },
  companyColor: { type: String, default: '#6366f1' },
  companyEmoji: { type: String, default: '🏢' },
  description: { type: String, default: '' },
  requirements: [String],
  responsibilities: [String],

  // Details
  location: { type: String, default: 'Remote' },
  salary: { type: String, default: 'Not disclosed' },
  salaryMin: Number,
  salaryMax: Number,
  currency: { type: String, default: 'INR' },
  mode: { type: String, enum: ['remote', 'hybrid', 'onsite'], default: 'remote' },
  expLevel: { type: String, enum: ['fresher', 'junior', 'mid', 'senior', 'lead'], default: 'junior' },
  type: { type: String, default: 'fullstack' },
  skills: [{ type: String }],

  // Source
  platform: { type: String, enum: ['linkedin', 'indeed', 'naukri', 'wellfound', 'company', 'other'], default: 'company' },
  applyUrl: { type: String, required: true },
  externalId: { type: String }, // ID from external API
  source: { type: String, default: 'internal' }, // internal | rapidapi | scraper

  // Dates
  postedAt: { type: Date, default: Date.now },
  expiresAt: Date,
  postedLabel: { type: String, default: 'Recently' },

  // Stats
  views: { type: Number, default: 0 },
  applications: { type: Number, default: 0 },
  aiMatchKeywords: [String],

  // Status
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },

}, { timestamps: true });

// Indexes for fast queries
jobSchema.index({ title: 'text', company: 'text', description: 'text', skills: 'text' });
jobSchema.index({ platform: 1, mode: 1, expLevel: 1 });
jobSchema.index({ postedAt: -1 });
jobSchema.index({ isActive: 1 });

// Compute postedLabel from postedAt
jobSchema.methods.getPostedLabel = function () {
  const now = new Date();
  const diff = Math.floor((now - this.postedAt) / 1000 / 60);
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
};

const Job = mongoose.model('Job', jobSchema);
module.exports = Job;
