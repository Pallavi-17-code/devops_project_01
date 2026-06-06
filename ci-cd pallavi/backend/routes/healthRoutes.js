const express = require('express');
const router = express.Router();
const db = require('../config/db');

// @route   GET /api/health
// @desc    Check API and Database status
// @access  Public
router.get('/', async (req, res) => {
  const healthStatus = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    services: {
      api: 'OK',
      database: 'UNKNOWN'
    }
  };

  try {
    // Attempt a simple query to verify DB connectivity
    await db.query('SELECT 1');
    healthStatus.services.database = 'OK';
    res.status(200).json(healthStatus);
  } catch (error) {
    healthStatus.status = 'DEGRADED';
    healthStatus.services.database = 'DOWN';
    healthStatus.error = error.message;
    res.status(503).json(healthStatus);
  }
});

// @route   GET /api/health/test
// @desc    Simple test endpoint to verify API is reachable
router.get('/test', (req, res) => {
  res.json({ message: 'API is working correctly' });
});

module.exports = router;
