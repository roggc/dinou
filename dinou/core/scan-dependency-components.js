// dinou/core/scan-dependency-components.js
// Scans dependencies for React "use client" directives without recursively walking massive trees.

const fs = require("fs");
const path = require("path");

function isSupportedClientModule(filePath, content) {
  const norm = filePath.replace(/\\/g, "/");
  if (!norm.includes("node_modules")) return true;
  if (content === undefined && fs.existsSync(filePath)) {
    try {
      content = fs.readFileSync(filePath, "utf8");
    } catch (e) {
      return false;
    }
  }
  if (typeof content !== "string") return false;
  if (content.includes("System.register(") || content.includes("System.registerDynamic(")) return false;
  if (content.includes("define.amd") && !content.includes("export ") && !content.includes("module.exports")) return false;
  return true;
}

function scanDependencyForClientComponents(depDir, clientFiles, useClientRegex) {
  const pkgJsonPath = path.join(depDir, "package.json");
  if (!fs.existsSync(pkgJsonPath)) return;
  let depPkg;
  try {
    depPkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
  } catch (e) {
    return;
  }

  const depName = depPkg.name || "";
  const hasReact =
    depPkg.dependencies?.react ||
    depPkg.peerDependencies?.react ||
    depPkg.devDependencies?.react ||
    (Array.isArray(depPkg.keywords) && depPkg.keywords.includes("react")) ||
    depName.toLowerCase().includes("react");
  if (!hasReact) return;

  const candidateFiles = new Set();
  if (typeof depPkg.main === "string") candidateFiles.add(path.resolve(depDir, depPkg.main));
  if (typeof depPkg.module === "string") candidateFiles.add(path.resolve(depDir, depPkg.module));
  if (depPkg.exports) {
    function addExport(exp) {
      if (typeof exp === "string") {
        if (/\.[jt]sx?$/.test(exp)) candidateFiles.add(path.resolve(depDir, exp));
      } else if (typeof exp === "object" && exp !== null) {
        for (const v of Object.values(exp)) addExport(v);
      }
    }
    addExport(depPkg.exports);
  }

  try {
    const rootEntries = fs.readdirSync(depDir, { withFileTypes: true });
    for (const entry of rootEntries) {
      if (!entry.isDirectory() && /\.[jt]sx?$/.test(entry.name)) {
        candidateFiles.add(path.join(depDir, entry.name));
      }
    }
  } catch (e) {}

  for (const filePath of candidateFiles) {
    if (!fs.existsSync(filePath)) continue;
    try {
      const content = fs.readFileSync(filePath, "utf8");
      if (useClientRegex.test(content.trim()) && isSupportedClientModule(filePath, content)) {
        clientFiles.add(path.resolve(filePath));
      }
    } catch (e) {}
  }
}

function scanProjectDependenciesForClientComponents(projectRoot, clientFiles, useClientRegex) {
  try {
    const pkgPath = path.resolve(projectRoot, "package.json");
    if (!fs.existsSync(pkgPath)) return;
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    const deps = Object.keys(pkg.dependencies || {});
    for (const dep of deps) {
      if (dep === "react" || dep === "react-dom" || dep === "dinou") continue;
      const depDir = path.resolve(projectRoot, "node_modules", dep);
      if (fs.existsSync(depDir)) {
        scanDependencyForClientComponents(depDir, clientFiles, useClientRegex);
      }
    }
  } catch (e) {}
}

module.exports = {
  isSupportedClientModule,
  scanDependencyForClientComponents,
  scanProjectDependenciesForClientComponents,
};
