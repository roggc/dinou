class ConcurrencyManager {
  constructor(maxConcurrent) {
    this.maxConcurrent = maxConcurrent;
    this.activeCount = 0;
    this.queue = [];
  }

  /**
   * Ejecuta una tarea asíncrona respetando el límite de concurrencia.
   * @param {Function} task - Función que devuelve una promesa (ej: tu lógica de render/fork)
   */
  async run(task) {
    // Si ya estamos a tope, esperamos en la cola
    if (this.activeCount >= this.maxConcurrent) {
      await new Promise((resolve) => this.queue.push(resolve));
    }

    this.activeCount++;

    try {
      return await task();
    } finally {
      this.activeCount--;

      // Si hay alguien esperando, le damos paso
      if (this.queue.length > 0) {
        const nextResolve = this.queue.shift();
        nextResolve();
      }
    }
  }

  // Opcional: Para métricas
  getStatus() {
    return { active: this.activeCount, queued: this.queue.length };
  }
}

// Instancia global (ajústalo según la RAM de tu servidor)
// Una regla general conservadora: CPUs * 2 o un número fijo como 10-20.
const os = require("os");
const MAX_PROCESSES =
  process.env.MAX_CONCURRENT_RENDERS || Math.max(1, os.cpus().length * 2);
// const MAX_PROCESSES = process.env.MAX_CONCURRENT_RENDERS || 10;

const processLimiter = new ConcurrencyManager(MAX_PROCESSES);

module.exports = processLimiter;
