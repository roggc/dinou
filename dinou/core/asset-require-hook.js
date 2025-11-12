var fs = require("fs");
var path = require("path");
var interpolateName = require("loader-utils").interpolateName;

function compiler(name, options) {
  return function compile(file) {
    var content = fs.readFileSync(file);
    var context = { resourcePath: file };

    var resolvedName;
    if (typeof name === "function") {
      var localName = path.basename(file, path.extname(file));
      resolvedName = name(localName, file);
    } else {
      resolvedName = name;
    }

    var result = interpolateName(context, resolvedName, {
      content: content,
      regExp: options.regExp,
    });

    if (options.publicPath) {
      result =
        typeof options.publicPath === "function"
          ? options.publicPath(result)
          : options.publicPath + result;
    }

    return result;
  };
}

function hook(extension, compile) {
  require.extensions[extension] = function (module, file) {
    try {
      const url = compile(file);
      module._compile("module.exports = " + JSON.stringify(url), file);
    } catch (err) {
      console.error("Error processing file", file, err);
      throw err;
    }
  };
}

function addHook(opts) {
  opts = opts || {};
  var extensions = (opts.extensions || []).map(function (ext) {
    return ext.replace(".", "");
  });
  var comp = compiler(opts.name, opts);

  extensions.forEach(function (ext) {
    hook("." + ext, comp);
  });
}

module.exports = addHook;
