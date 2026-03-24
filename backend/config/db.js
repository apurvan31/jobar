// config/db.js — MongoDB connection with Mongoose
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  const dbUrl = process.env.MONGODB_URI;

  if (!dbUrl && process.env.NODE_ENV === 'production') {
    logger.error('❌ MONGODB_URI is not defined in environment variables! Deployment will fail.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(dbUrl || 'mongodb://localhost:27017/jobbar', {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info(`✅ MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Reconnecting...');
    });

    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB error: ${err.message}`);
    });

  } catch (error) {
    logger.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
