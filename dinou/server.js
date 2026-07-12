module.exports = {
  revalidatePath: async function (path) {
    const { revalidatePath: fn } = require("./core/cache-revalidate.js");
    return fn(path);
  },
  revalidateTag: async function (tag) {
    const { revalidateTag: fn } = require("./core/cache-revalidate.js");
    return fn(tag);
  },
};
