// ─── Pipeline Controller ─────────────────────────────────────────────────────
// This controller handles CI/CD pipeline operations

const db = require('../config/db');
const log = require('../utils/logger');

// @desc    Get all pipelines
// @route   GET /api/pipelines
exports.getPipelines = async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM pipelines ORDER BY id DESC');
    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new pipeline
// @route   POST /api/pipelines
exports.createPipeline = async (req, res, next) => {
  const { name, repository_url } = req.body;
  
  if (!name || !repository_url) {
    log.warn('Stream Initialization Failed: Missing configuration data');
    return res.status(400).json({ success: false, message: 'Please provide name and repository URL' });
  }

  try {
    const result = await db.query(
      'INSERT INTO pipelines (name, repository_url) VALUES ($1, $2) RETURNING *',
      [name, repository_url]
    );
    log.success(`New Operational Stream Provisioned: ${name}`);
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    log.error(`Stream Provisioning Fault: ${error.message}`);
    next(error);
  }
};

// @desc    Trigger a pipeline build (Dummy)
// @route   POST /api/pipelines/:id/build
exports.triggerBuild = async (req, res, next) => {
  const { id } = req.params;

  try {
    // 1. Update status to 'building'
    await db.query('UPDATE pipelines SET status = $1, last_run = NOW() WHERE id = $2', ['building', id]);
    log.info(`Pipeline ${id} build sequence initiated. Awaiting telemetry...`);

    // 2. Simulate build process (Async)
    setTimeout(async () => {
      const outcome = Math.random() > 0.2 ? 'success' : 'failed';
      await db.query('UPDATE pipelines SET status = $1 WHERE id = $2', [outcome, id]);
      if (outcome === 'success') {
        log.success(`Pipeline ${id} build sequence complete. Status: NOMINAL`);
      } else {
        log.error(`Pipeline ${id} build sequence complete. Status: CRITICAL FAILURE`);
      }
    }, 5000);

    res.status(200).json({
      success: true,
      message: 'Build triggered successfully',
      pipelineId: id
    });
  } catch (error) {
    log.error(`Pipeline trigger fault: ${error.message}`);
    next(error);
  }
};

// @desc    Delete a pipeline
// @route   DELETE /api/pipelines/:id
exports.deletePipeline = async (req, res, next) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM pipelines WHERE id = $1 RETURNING *', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Pipeline not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Pipeline deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
