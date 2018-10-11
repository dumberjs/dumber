'use strict';
const through = require('through2');
const gutil = require('gulp-util');
const PluginError = gutil.PluginError;

const PLUGIN_NAME = 'dumber';

/*
Optional options:

dependencies: [
  'npm_package_not_explicitly_required_by_your_code',
  {
    // This creates a shim
    name: 'very_old_npm_package_does_not_support_amd_or_cjs',
    deps: ['jquery'],
    exports: 'jQuery.veryOld',
    wrapShim: true // optional shim wrapper
  }
]

// additional deps finder, on top of standard amd+cjs deps finder
depsFinder: function (filename: string, file_contents: string) {
  return string_array_of_additional_module_ids;
}

// optional npm package locator, replace default npm package locator
// which search local node_modules folders
npmPackageLocator: function (packageName: string) {
  // filePath is local within the package,
  // like:
  //   package.json
  //   dist/cjs/index.js
  return Promise.resolve(
    function (filePath: string) {
      return Promise.resolve({
        path: file_path,
        contents: file_contents_in_string
      });
    }
  };
}

// missing npm package handler
onMissingNpmPackage: function (packageName: string) {
  return new Promise((resolve, reject) => {
    // you could install a package, then
    resolve();
    // or if cannot finish installation
    reject(err);
  });
}
*/
function trace () {
  // track resolved moduleId to avoid file duplication

  /*
  let dependencies;
  let depsFinder;
  let npmPackageLocator;
  let onMissingNpmPackage;

  if (options) {
    dependencies = options.dependencies || [];
    depsFinder = options.depsFinder;
    npmPackageLocator = options.npmPackageLocator || defaultLocator;
    onMissingNpmPackage = options.onMissingNpmPackage;
  }
  */
  // TODO resolve dependencies in first run.


  return through.obj(function(file, enc, cb) {
    if (file.isStream()) {
      this.emit('error', new PluginError(PLUGIN_NAME, 'Stream is not supported'));
    }

    if (file.isBuffer()) {
      // TODO
    } else {
      this.push(file);
      cb();
    }

  }, function(cb) {
    // flush
    cb();
  });
}

module.exports = trace;
