const fs = require("fs");
const path = require("path");

const statusMap = new Map();
let isLoaded = false;

function loadFromFile() {
  if (isLoaded) return;
  try {
    const filePath = path.resolve(process.cwd(), ".dinou/dist2/status-manifest.json");
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
      for (const [k, v] of Object.entries(data)) {
        statusMap.set(k, v);
      }
    }
  } catch (e) {}
  isLoaded = true;
}

function saveToFile() {
  try {
    const dist2 = path.resolve(process.cwd(), ".dinou/dist2");
    if (!fs.existsSync(dist2)) {
      fs.mkdirSync(dist2, { recursive: true });
    }
    const filePath = path.join(dist2, "status-manifest.json");
    const obj = Object.fromEntries(statusMap.entries());
    fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), "utf8");
  } catch (e) {}
}

function getStatus(reqPath) {
  loadFromFile();
  // Also check without trailing slash or with trailing slash
  const clean = reqPath.endsWith("/") ? reqPath.slice(0, -1) : reqPath;
  const withSlash = clean + "/";
  return (
    statusMap.get(reqPath)?.status ??
    statusMap.get(clean)?.status ??
    statusMap.get(withSlash)?.status
  );
}

function updateStatus(reqPath, status) {
  loadFromFile();
  const current = statusMap.get(reqPath)?.status;
  if (current === status) return;

  statusMap.set(reqPath, { status });
  saveToFile();
}

module.exports = { getStatus, updateStatus };
