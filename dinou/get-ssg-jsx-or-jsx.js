const getJSX = require("./get-jsx.js");
const getSSGJSX = require("./get-ssg-jsx.js");

async function getSSGJSXOrJSX(reqPath, query, isDevelopment = false) {
  const result =
    Object.keys(query).length || isDevelopment
      ? await getJSX(reqPath, query)
      : getSSGJSX(reqPath) ?? (await getJSX(reqPath, query));
  return result;
}

module.exports = getSSGJSXOrJSX;
