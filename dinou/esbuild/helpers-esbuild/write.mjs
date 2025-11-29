import fs from "node:fs/promises";
import path from "node:path";
import { regex } from "../../core/asset-extensions.js";

export default async function write(result) {
  if (!result.metafile) {
    return;
  }
  const skipSet = new Set();
  const normalizeRel = (p) => p.replace(/\\/g, "/");
  const cssRegex = /\.(css|scss|less)$/i;
  for (const [relPath, info] of Object.entries(result.metafile.outputs)) {
    if (!info.entryPoint) continue;
    let entryPointNormalized = info.entryPoint;
    if (entryPointNormalized.startsWith("dinou-asset:")) {
      entryPointNormalized = entryPointNormalized.replace("dinou-asset:", "");
    }
    const inputKeys = Object.keys(info.inputs);
    // Lógica para assets
    if (
      regex.test(entryPointNormalized) &&
      inputKeys.length === 1 &&
      inputKeys[0] === info.entryPoint
    ) {
      // Saltar el .js inútil
      const normalizedPath = normalizeRel(relPath);
      skipSet.add(normalizedPath);
      // Saltar el .map correspondiente si existe
      const mapRelPath = relPath.replace(/\.js$/, ".js.map");
      if (result.metafile.outputs[mapRelPath]) {
        skipSet.add(normalizeRel(mapRelPath));
      }
    }
    // Lógica para CSS
    if (
      cssRegex.test(info.entryPoint) &&
      ((inputKeys.length === 1 && inputKeys[0] === info.entryPoint) ||
        inputKeys.length === 0)
    ) {
      // Saltar el .js inútil
      const normalizedPath = normalizeRel(relPath);
      skipSet.add(normalizedPath);
      // Saltar el .map correspondiente si existe
      const mapRelPath = relPath + ".map";
      if (result.metafile.outputs[mapRelPath]) {
        skipSet.add(normalizeRel(mapRelPath));
      }
    }
  }
  for (const file of result.outputFiles) {
    const fileRelPath = normalizeRel(path.relative(process.cwd(), file.path));
    if (skipSet.has(fileRelPath)) {
      continue;
    }
    await fs.mkdir(path.dirname(file.path), { recursive: true });
    await fs.writeFile(file.path, file.contents);
  }
  console.log(`✓ Build completed`);
}
