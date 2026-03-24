// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name too long'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  googleId: { type: String, sparse: true },
  avatar: { type: String, default: '' },
  isEmailVerified: { type: Boolean, default: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },

  // Profile
  phone: { type: String, default: '' },
  location: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  portfolio: { type: String, default: '' },
  github: { type: String, default: '' },
  jobTitle: { type: String, default: '' },
  about: { type: String, default: '' },
  skills: [{ type: String }],
  expectedSalary: { type: String, default: '' },
  yearsOfExperience: { type: Number, default: 0 },
  noticePeriod: { type: String, default: 'immediate' },
  workAuth: { type: String, default: 'citizen' },
  willingToRelocate: { type: String, default: 'yes' },
  visaSponsorship: { type: String, default: 'no' },
  graduationYear: { type: Number },
  gender: { type: String, default: 'prefer_not' },
  coverLetterTemplate: { type: String, default: '' },

  // Stats
  profileViews: { type: Number, default: 0 },
  lastLogin: { type: Date },
  loginCount: { type: Number, default: 0 },

  // Resume reference
  activeResume: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },

  // Preferences
  preferences: {
    roles: [String],
    locations: [String],
    workModes: [String],
    salaryMin: Number,
    emailNotifications: { type: Boolean, default: true },
  },

  // Activity log
  activityLog: [{
    action: String,
    detail: String,
    timestamp: { type: Date, default: Date.now },
  }],

}, { timestamps: true });

// ---- Hash password before save ----
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ---- Compare password ----
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ---- Get initials ----
userSchema.methods.getInitials = function () {
  return this.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
};

// ---- Log activity ----
userSchema.methods.logActivity = async function (action, detail) {
  this.activityLog.push({ action, detail });
  if (this.activityLog.length > 100) {
    this.activityLog = this.activityLog.slice(-100); // Keep last 100
  }
  await this.save();
};

const User = mongoose.model('User', userSchema);
module.exports = User;
