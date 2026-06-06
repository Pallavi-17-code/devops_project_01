require('dotenv').config();

/**
 * Utility to interact with Jenkins API
 */
const jenkinsUtil = {
  /**
   * Get basic system info from Jenkins
   */
  getSystemInfo: async () => {
    const { JENKINS_URL, JENKINS_USER, JENKINS_TOKEN } = process.env;
    const auth = Buffer.from(`${JENKINS_USER}:${JENKINS_TOKEN}`).toString('base64');

    try {
      const response = await fetch(`${JENKINS_URL}/api/json`, {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      });

      if (!response.ok) throw new Error(`Jenkins error: ${response.statusText}`);
      
      return await response.json();
    } catch (error) {
      console.error('Jenkins Connection Error:', error.message);
      return { status: 'offline', message: error.message };
    }
  },

  /**
   * Trigger a build for a specific job
   */
  triggerBuild: async (jobName) => {
    const { JENKINS_URL, JENKINS_USER, JENKINS_TOKEN } = process.env;
    const auth = Buffer.from(`${JENKINS_USER}:${JENKINS_TOKEN}`).toString('base64');

    try {
      const response = await fetch(`${JENKINS_URL}/job/${jobName}/build`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Jenkins Trigger Error:', error.message);
      return false;
    }
  },

  /**
   * Get stage info for a specific job
   */
  getBuildStages: async (jobName) => {
    const { JENKINS_URL, JENKINS_USER, JENKINS_TOKEN } = process.env;
    const auth = Buffer.from(`${JENKINS_USER}:${JENKINS_TOKEN}`).toString('base64');

    try {
      const response = await fetch(`${JENKINS_URL}/job/${jobName}/lastBuild/wfapi/describe`, {
        headers: { 'Authorization': `Basic ${auth}` }
      });
      const data = await response.json();
      return data.stages.map(s => ({
        id: s.id,
        name: s.name,
        status: s.status,
        duration: (s.durationMillis / 1000).toFixed(1) + 's'
      }));
    } catch (error) {
      return [];
    }
  },

  /**
   * Get console output for a specific job build
   */
  getBuildLogs: async (jobName, buildNumber = 'lastBuild') => {
    const { JENKINS_URL, JENKINS_USER, JENKINS_TOKEN } = process.env;
    const auth = Buffer.from(`${JENKINS_USER}:${JENKINS_TOKEN}`).toString('base64');

    try {
      const response = await fetch(`${JENKINS_URL}/job/${jobName}/${buildNumber}/logText/progressiveText`, {
        headers: { 'Authorization': `Basic ${auth}` }
      });
      return await response.text();
    } catch (error) {
      return `Error fetching logs: ${error.message}`;
    }
  }
};

module.exports = jenkinsUtil;
