'use strict';
const util = require('util');
const fs = require('fs');
const path = require('path');

const fsStat = util.promisify(fs.stat);
const fsReadFile = util.promisify(fs.readFile);

// default locator using nodejs to resolve package
module.exports = function (packageName, mock) {
  // decoupling for testing
  let _resolve = (mock && mock.resolve) || require.resolve;
  let packagePath;

  try {
    let metaPath = _resolve(packageName + '/package.json');
    packagePath = metaPath.substr(0, metaPath.length - 13);
  } catch (e) {
    return Promise.reject(new Error('cannot find npm package: ' + packageName));
  }

  return fsStat(packagePath).then(
    function () {
      return function (filePath) {
        const fp = path.join(packagePath, filePath);
        return fsReadFile(fp)
        .then(function (buffer) {
          return {
            path: path.resolve(fp),
            contents: buffer.toString()
          };
        });
      }
    }
  );
};
