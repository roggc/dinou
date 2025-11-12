const genericNames = require("generic-names");
const path = require("path");

const generate = genericNames("[hash:base64]", {
  context: path.resolve(process.cwd(), "src"),
});

module.exports = generate;
