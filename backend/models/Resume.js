// models/Resume.js
const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // File info
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  filePath: { type: String, required: true },

  // Parsed data (AI extracted)
  parsedData: {
    name: String,
    email: String,
    phone: String,
    location: String,
    summary: String,
    skills: [String],
    experience: [{
      company: String,
      role: String,
      duration: String,
      description: String,
    }],
    education: [{
      institution: String,
      degree: String,
      year: String,
      gpa: String,
    }],
    projects: [{
      name: String,
      description: String,
      tech: [String],
      link: String,
    }],
    certifications: [String],
    languages: [String],
    totalYearsExperience: Number,
  },

  // AI scores
  atsScore: { type: Number, default: 0 },
  completenessScore: { type: Number, default: 0 },
  keywordsFound: [String],
  suggestions: [String],

  // Metadata
  label: { type: String, default: 'My Resume' },
  isActive: { type: Boolean, default: false },
  parsedAt: Date,
  rawText: String,

}, { timestamps: true });

resumeSchema.index({ user: 1, createdAt: -1 });

const Resume = mongoose.model('Resume', resumeSchema);
module.exports = Resume;
