// scripts/seed.js — Seed initial jobs into the database
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const { seedMockJobs } = require('../services/jobFetcher');
const logger = require('../utils/logger');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobbar');
    logger.info('Connected to MongoDB — seeding...');
    const jobs = await seedMockJobs();
    logger.info(`Seeded ${jobs.length} jobs`);
  } catch (err) {
    logger.error(err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
