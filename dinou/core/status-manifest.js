const statusMap = new Map();

// 2. FUNCIÓN DE LECTURA (Síncrona, Instantánea)
function getStatus(reqPath) {
  return statusMap.get(reqPath)?.status;
}

// 3. FUNCIÓN DE ESCRITURA
function updateStatus(reqPath, status) {
  const current = statusMap.get(reqPath)?.status;
  if (current === status) return; // No hay cambios

  statusMap.set(reqPath, { status });
}

module.exports = { getStatus, updateStatus };
