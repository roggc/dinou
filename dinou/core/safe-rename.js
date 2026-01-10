const fs = require("fs").promises;

async function safeRename(oldPath, newPath, retries = 5, delay = 100) {
  for (let i = 0; i < retries; i++) {
    try {
      await fs.rename(oldPath, newPath);
      return;
    } catch (err) {
      if (err.code !== "EPERM" && err.code !== "EBUSY") {
        throw err;
      }

      if (i === retries - 1) {
        console.error(
          `[ISR] Failed to rename locked file after ${retries} attempts: ${newPath}`
        );
        throw err;
      }

      await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
    }
  }
}

module.exports = { safeRename };
