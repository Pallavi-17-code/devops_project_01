const dockerUtil = require('../utils/dockerUtil');

// @desc    Get Docker system status
// @route   GET /api/docker/status
exports.getDockerStatus = async (req, res, next) => {
  try {
    const status = await dockerUtil.checkDockerStatus();
    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get running containers
// @route   GET /api/docker/containers
exports.getContainers = async (req, res, next) => {
  try {
    const containers = await dockerUtil.listContainers();
    res.status(200).json({
      success: true,
      count: containers.length,
      data: containers
    });
  } catch (error) {
    // If docker is not running, listContainers might fail
    res.status(503).json({
      success: false,
      message: 'Docker service is unavailable or not running',
      error: error.message
    });
  }
};
