import genericNames from "generic-names";
import path from "node:path";

const generate = genericNames("[hash:base64]", {
  context: path.resolve(process.cwd(), "src"),
});

export default generate;
