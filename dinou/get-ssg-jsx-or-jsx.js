const getJSX = require("./get-jsx.js");
const getSSGJSX = require("./get-ssg-jsx.js");

async function getSSGJSXOrJSX(
  reqPath,
  query,
  cookies = {},
  isDevelopment = false
) {
  const result =
    Object.keys(query).length || isDevelopment || Object.keys(cookies).length
      ? await getJSX(reqPath, query, cookies)
      : (await getSSGJSX(reqPath)) ?? (await getJSX(reqPath, query, cookies));
  return result;
}

module.exports = getSSGJSXOrJSX;
