class ConcurrencyManager {
  constructor(maxConcurrent) {
    this.maxConcurrent = maxConcurrent;
    this.activeCount = 0;
    this.queue = [];
  }

  /**
   * Executes an asynchronous task respecting the concurrency limit.
   * @param {Function} task - Function that returns a promise (e.g., your render/fork logic)
   */
  async run(task) {
    // If we are already at maximum, wait in the queue
    if (this.activeCount >= this.maxConcurrent) {
      await new Promise((resolve) => this.queue.push(resolve));
    }

    this.activeCount++;

    try {
      return await task();
    } finally {
      this.activeCount--;

      // If there is someone waiting, let them proceed
      if (this.queue.length > 0) {
        const nextResolve = this.queue.shift();
        nextResolve();
      }
    }
  }

  // Optional: For metrics
  getStatus() {
    return { active: this.activeCount, queued: this.queue.length };
  }
}

// Global instance (adjust according to your server's RAM)
// A conservative general rule: CPUs * 2 or a fixed number like 10-20.
const os = require("os");
const MAX_PROCESSES =
  process.env.MAX_CONCURRENT_RENDERS || Math.max(1, os.cpus().length * 2);
// const MAX_PROCESSES = process.env.MAX_CONCURRENT_RENDERS || 10;

const processLimiter = new ConcurrencyManager(MAX_PROCESSES);

module.exports = processLimiter;
