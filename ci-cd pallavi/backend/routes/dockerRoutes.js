const express = require('express');
const router = express.Router();
const { getDockerStatus, getContainers } = require('../controllers/dockerController');
const { protect } = require('../middleware/authMiddleware');

// Protect all docker routes (Disabled for testing)
// router.use(protect);

router.get('/status', getDockerStatus);
router.get('/containers', getContainers);

module.exports = router;
