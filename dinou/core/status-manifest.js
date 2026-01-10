const statusMap = new Map();

function getStatus(reqPath) {
  return statusMap.get(reqPath)?.status;
}

function updateStatus(reqPath, status) {
  const current = statusMap.get(reqPath)?.status;
  if (current === status) return;

  statusMap.set(reqPath, { status });
}

module.exports = { getStatus, updateStatus };
