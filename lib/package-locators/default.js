'use strict';
const util = require('util');
const fs = require('fs');
const path = require('path');

const fsStat = util.promisify(fs.stat);
const fsReadFile = util.promisify(fs.readFile);

// default locator for local node_modules folder
module.exports = function (packageName) {
  let packagePath = path.join('node_modules', packageName);

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
