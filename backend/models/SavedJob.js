// models/SavedJob.js
const mongoose = require('mongoose');

const savedJobSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },

  // Snapshot at time of saving
  company: String,
  role: String,
  companyColor: String,
  companyEmoji: String,
  platform: String,
  location: String,
  salary: String,
  mode: String,
  applyUrl: String,

  notes: { type: String, default: '' },
  tags: [String],

}, { timestamps: true });

savedJobSchema.index({ user: 1, job: 1 }, { unique: true });

const SavedJob = mongoose.model('SavedJob', savedJobSchema);
module.exports = SavedJob;
