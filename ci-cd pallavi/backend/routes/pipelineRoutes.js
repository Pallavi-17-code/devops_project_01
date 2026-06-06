const express = require('express');
const router = express.Router();
const { getPipelines, createPipeline, triggerBuild, deletePipeline } = require('../controllers/pipelineController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/pipelines/public
// @desc    View all pipelines (No Token Required for testing)
router.get('/public', getPipelines);

// All routes below this line are public (JWT check removed for testing)
// router.use(protect);

// @route   GET /api/pipelines
router.get('/', getPipelines);

// @route   POST /api/pipelines
router.post('/', createPipeline);

// @route   POST /api/pipelines/:id/build
router.post('/:id/build', triggerBuild);

// @route   DELETE /api/pipelines/:id
router.delete('/:id', deletePipeline);

module.exports = router;
