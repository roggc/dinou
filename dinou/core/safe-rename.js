// dinou/core/promote-to-static.js
const fs = require("fs").promises;

async function safeRename(oldPath, newPath, retries = 5, delay = 100) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`attempt rename number ${i}`);
      // Intentamos el renombrado atómico estándar
      await fs.rename(oldPath, newPath);
      return; // ¡Éxito! Salimos.
    } catch (err) {
      // Si el error NO es por bloqueo (EPERM/EBUSY), lanzamos error real.
      if (err.code !== "EPERM" && err.code !== "EBUSY") {
        throw err;
      }

      // Si es el último intento, nos rendimos y lanzamos el error
      if (i === retries - 1) {
        console.error(
          `[ISR] Failed to rename locked file after ${retries} attempts: ${newPath}`
        );
        throw err;
      }

      // Esperamos un poco antes de reintentar (Backoff lineal o exponencial)
      // Ejemplo: 100ms, 200ms, 300ms...
      await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
    }
  }
}

module.exports = { safeRename };
