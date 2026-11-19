import path from "node:path";
import { fileURLToPath } from "node:url";
import { runEject } from "./dinou/core/uneject.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function eject(options = {}) {
    return runEject({
        ...options,
        sourceDinouDir: path.resolve(__dirname, "dinou"),
    });
}

export default eject;