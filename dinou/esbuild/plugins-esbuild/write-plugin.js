import write from "../helpers-esbuild/write.js";

export default function writePlugin() {
  return {
    name: "write-plugin",
    setup(build) {
      build.onEnd(write);
    },
  };
}
