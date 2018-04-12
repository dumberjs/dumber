'use strict';
const util = require('util');
const fs = require('fs');
const path = require('path');

const fsStat = util.promisify(fs.stat);
const fsReadFile = util.promisify(fs.readFile);

module.exports = function (packageName) {
  let packagePath = path.join('node_modules', packageName);

  return fsStat(packagePath).then(
    function () {
      return function (filePath) {
        return fsReadFile(path.join(packagePath, filePath));
      }
    }
  );
};
