// routes/news.js — Tech & Career News Integration
const express = require('express');
const router = express.Router();
const axios = require('axios');
const logger = require('../utils/logger');
const { protect } = require('../middleware/auth');

// ---- GET /api/news/career ----
router.get('/career', protect, async (req, res, next) => {
  try {
    // Using Dev.to's free public API (No Key Needed!)
    const response = await axios.get('https://dev.to/api/articles', {
      params: {
        tag: 'career',
        per_page: 5,
        top: 7
      }
    });

    const news = response.data.map(article => ({
      title: article.title,
      description: article.description,
      url: article.url,
      image: article.cover_image || article.social_image,
      author: article.user?.name,
      publishedAt: article.published_at
    }));

    res.json({ news });
  } catch (err) {
    logger.error(`News fetch failed: ${err.message}`);
    // Mock news as fallback
    res.json({
      news: [
        { title: "Top 5 High-Paying Tech Roles in 2024", description: "Learn which skills are in demand for the upcoming year.", url: "https://job.bar/tips/1", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400" },
        { title: "How to Ace the System Design Round", description: "Mastering large-scale architecture interviews.", url: "https://job.bar/tips/2", image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400" }
      ]
    });
  }
});

module.exports = router;
