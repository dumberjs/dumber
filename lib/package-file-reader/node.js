const path = require('path');
const {resolvePackagePath, fsReadFile} = require('../shared');
const {info, warn} = require('../log');
const {ext} = require('dumber-module-loader/dist/id-utils');

// default fileReader using nodejs to resolve package
module.exports = function(packageConfig, mock) {
  const name = packageConfig.name;
  // decoupling for testing
  const _resolve = (mock && mock.resolve) || resolvePackagePath;
  const _readFile = (mock && mock.readFile) || fsReadFile;
  const dumberForcedMain = packageConfig.main;
  let packagePath;

  if (packageConfig.location) {
    packagePath = packageConfig.location;
  } else {
    packagePath = _resolve(name);
  }

  const fileReader = filePath => {
    const fp = path.join(packagePath, filePath);
    const relativePath = path.relative(path.resolve(), path.resolve(fp)).replace(/\\/g, '/');

    if (filePath === 'package.json' || filePath === './package.json') {
      // read version from existing package.json
      return _readFile(fp)
      .then(buffer => JSON.parse(buffer.toString()))
      .catch(err => {
        warn('Failed to read package.json found at ' + name + '/' + relativePath + ': ' + err.message);
        const meta = {name: name, version: 'N/A', main: 'index'};
        info('Fall back to ' + JSON.stringify(meta));
        return meta;
      })
      .then(meta => {
        // Force name from config. When explicit config, the meta.name might be different.
        // e.g. { name: 'foo', location: 'node_modules/bar' }.
        if (meta.name !== name) {
          meta.name = name;
        }

        if (dumberForcedMain) {
          meta.dumberForcedMain = dumberForcedMain;
        }

        return {
          path: relativePath,
          contents: JSON.stringify(meta)
        };
      });
    }

    return _readFile(fp)
    .then(buffer => {
      return {
        path: relativePath,
        contents: buffer.toString(ext(filePath) === '.wasm' ? 'base64' : undefined)
      };
    });
  };

  fileReader.packageConfig = packageConfig;
  return Promise.resolve(fileReader);
};
