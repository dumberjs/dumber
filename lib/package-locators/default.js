'use strict';
const util = require('util');
const fs = require('fs');
const path = require('path');

const fsStat = util.promisify(fs.stat);
const fsReadFile = util.promisify(fs.readFile);

// default locator using nodejs to resolve package
module.exports = function (packageConfig, mock) {
  let name = packageConfig.name;
  // decoupling for testing
  let _resolve = (mock && mock.resolve) || require.resolve;
  let packagePath;
  let hardCodedMain = packageConfig.main;

  if (packageConfig.path) {
    packagePath = packageConfig.path;
  } else {
    try {
      let metaPath = _resolve(name + '/package.json');
      packagePath = metaPath.substr(0, metaPath.length - 13);
    } catch (e) {
      return Promise.reject(new Error('cannot find npm package: ' + name));
    }
  }


  return fsStat(packagePath).then(
    function () {
      return function (filePath) {
        const fp = path.join(packagePath, filePath);

        if (hardCodedMain && (filePath === 'package.json' || filePath === './package.json')) {
          return Promise.resolve({
            path: path.resolve(fp),
            contents: JSON.stringify({name: name, main: hardCodedMain})
          });
        }

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
