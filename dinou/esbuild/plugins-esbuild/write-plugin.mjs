import write from "../helpers-esbuild/write.mjs";

export default function writePlugin() {
  return {
    name: "write-plugin",
    setup(build) {
      build.onEnd(write);
    },
  };
}
