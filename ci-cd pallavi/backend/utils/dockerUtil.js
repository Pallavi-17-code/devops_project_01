const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * @desc    Utility for interacting with Docker CLI
 */
const dockerUtil = {
  // Check if Docker is installed and running
  async checkDockerStatus() {
    try {
      await execPromise('docker version');
      return { installed: true, running: true };
    } catch (error) {
      return { installed: false, running: false, error: error.message };
    }
  },

  // List all running containers
  async listContainers() {
    try {
      const { stdout } = await execPromise('docker ps --format "{{json .}}"');
      // The format returns separate JSON objects per line
      const containers = stdout
        .trim()
        .split('\n')
        .filter(line => line)
        .map(line => JSON.parse(line));
      return containers;
    } catch (error) {
      throw new Error(`Failed to list containers: ${error.message}`);
    }
  },

  // Get stats for a specific container
  async getContainerStats() {
    try {
      const { stdout } = await execPromise('docker stats --no-stream --format "{{json .}}"');
      const stats = stdout
        .trim()
        .split('\n')
        .filter(line => line)
        .map(line => JSON.parse(line));
      return stats;
    } catch (error) {
      throw new Error(`Failed to fetch Docker stats: ${error.message}`);
    }
  },

  // Restart a container
  async restartContainer(containerId) {
    await execPromise(`docker restart ${containerId}`);
    return true;
  },

  // Stop a container
  async stopContainer(containerId) {
    await execPromise(`docker stop ${containerId}`);
    return true;
  }
};

module.exports = dockerUtil;
