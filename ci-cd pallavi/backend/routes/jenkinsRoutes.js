const express = require('express');
const router = express.Router();
const { getJenkinsStatus, triggerJenkinsBuild, getJenkinsLogs, getJenkinsStages } = require('../controllers/jenkinsController');

// Get Jenkins system status
router.get('/status', getJenkinsStatus);

// Trigger build for a specific job
router.post('/build/:jobName', triggerJenkinsBuild);

// Get console output for a job
router.get('/logs/:jobName', getJenkinsLogs);

// Get pipeline stages for a job
router.get('/stages/:jobName', getJenkinsStages);

module.exports = router;
