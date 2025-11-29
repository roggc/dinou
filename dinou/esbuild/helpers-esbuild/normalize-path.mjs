import path from "node:path";

const normalizePath = (p) => p.split(path.sep).join(path.posix.sep);

export default normalizePath;
