'use strict';
const idUtils = require('./id-utils');

function PackageReader (locator) {
  this.locator = locator;
  this._readFile = this._readFile.bind(this);
}

PackageReader.prototype.readPackageJson = function () {
  let self = this;

  if (self.hasOwnProperty('mainPath')) return Promise.resolve();

  return self.locator('package.json').then(function (file) {
    const meta = JSON.parse(file.contents);
    self.name = meta.name;

    let main = meta.main || 'index.js';
    if (main.startsWith('./')) main = main.substr(2);
    if (main.endsWith('/')) main = main.substr(0, main.length - 1);

    return self._targetPath(main);
  }).then(function (mainPath) {
    self.mainPath = mainPath;
    self.parsedMainId = idUtils.parse(mainPath);
  });
};

PackageReader.prototype._targetPath = function (id) {
  let self = this;

  if (idUtils.ext(id)) {
    return Promise.resolve(id);
  } else {
    const directRef = id + '.js';
    const implicitRef = id + '/index.js';
    // when main is "lib", it could means lib.js or lib/index.js
    return self.locator(directRef).then(
      function () { return directRef; },
      function () {
        return self.locator(implicitRef).then(
          function () { return implicitRef; }
        );
      }
    );
  }
}

PackageReader.prototype.readMain = function () {
  let self = this;

  return self.readPackageJson().then(function () {
    return self.locator(self.mainPath).then(function (file) {
      return {
        path: file.path,
        contents: file.contents,
        moduleId: self.name + '/' + self.parsedMainId.bareId,
        packageName: self.name
      };
    });
  });
};

PackageReader.prototype.readResource = function (resource) {
  let self = this;

  return self.readPackageJson().then(function () {
    let parts = self.parsedMainId.parts;
    let len = parts.length;
    let i = 0;

    function findResource () {
      if (i >= len) new Promise.reject(new Error("could not find " + resource));

      let resParts = parts.slice(0, i);
      resParts.push(resource);

      let fullId = resParts.join('/');

      return self._targetPath(fullId).then(
        self._readFile,
        function () {
          i += 1;
          return findResource();
        }
      );
    }

    return findResource();
  });
};

PackageReader.prototype._readFile = function (filePath) {
  let self = this;

  return self.locator(filePath).then(function (file) {
    return {
      path: file.path,
      contents: file.contents,
      moduleId: self.name + '/' + idUtils.parse(filePath).bareId,
      packageName: self.name
    };
  });
};

module.exports = PackageReader;
