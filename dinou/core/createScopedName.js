import genericNames from "#generic-names";
import path from "node:path";
import { normalizePathCase } from "./path-utils.js";

const generatorCache = new Map();

function normalizeForHash(p) {
  if (!p || typeof p !== "string") return "";
  return normalizePathCase(path.resolve(p)).replace(/\\/g, "/");
}

function getGenerator(contextDir) {
  let gen = generatorCache.get(contextDir);
  if (!gen) {
    gen = genericNames("[hash:base64]", { context: contextDir });
    generatorCache.set(contextDir, gen);
  }
  return gen;
}

export default function createScopedName(localName, filepath) {
  const contextDir = normalizeForHash(path.resolve(process.cwd(), "src"));
  const normalizedFilepath = filepath ? normalizeForHash(filepath) : filepath;
  return getGenerator(contextDir)(localName, normalizedFilepath);
}

