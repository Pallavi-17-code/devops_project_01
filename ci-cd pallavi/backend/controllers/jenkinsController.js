const jenkinsUtil = require('../utils/jenkinsUtil');
const log = require('../utils/logger');

/**
 * Controller for Jenkins operations
 */
const getJenkinsStatus = async (req, res, next) => {
  try {
    const info = await jenkinsUtil.getSystemInfo();
    res.json({
      success: true,
      data: info
    });
  } catch (error) {
    next(error);
  }
};

const triggerJenkinsBuild = async (req, res, next) => {
  try {
    const { jobName } = req.params;
    log.info(`Initiating Jenkins Sub-Routine for Pipeline: ${jobName}`);
    const success = await jenkinsUtil.triggerBuild(jobName);
    
    if (success) {
      log.success(`Jenkins Handshake Complete. Build Started: ${jobName}`);
      res.json({
        success: true,
        message: `Build triggered for ${jobName}`
      });
    } else {
      res.status(500).json({
        success: false,
        message: `Failed to trigger build for ${jobName}`
      });
    }
  } catch (error) {
    next(error);
  }
};

const getJenkinsLogs = async (req, res, next) => {
  try {
    const { jobName } = req.params;
    const logs = await jenkinsUtil.getBuildLogs(jobName);
    res.send(logs);
  } catch (error) {
    next(error);
  }
};

const getJenkinsStages = async (req, res, next) => {
  try {
    const { jobName } = req.params;
    const stages = await jenkinsUtil.getBuildStages(jobName);
    res.json({ success: true, data: stages });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getJenkinsStatus,
  triggerJenkinsBuild,
  getJenkinsLogs,
  getJenkinsStages
};
