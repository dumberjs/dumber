import path from 'path';
import {resolvePackagePath, fsReadFile} from '../shared';
import {info, warn} from '../log';
import {ext} from 'dumber-module-loader/dist/id-utils';

// default fileReader using nodejs to resolve package
export default function (packageConfig, mock) {
  let name = packageConfig.name;
  // decoupling for testing
  let _resolve = (mock && mock.resolve) || resolvePackagePath;
  let _readFile = (mock && mock.readFile) || fsReadFile;
  let packagePath;
  let hardCodedMain = packageConfig.main;

  if (packageConfig.location) {
    packagePath = packageConfig.location;
  } else {
    packagePath = _resolve(name);
  }

  return Promise.resolve(filePath => {
    const fp = path.join(packagePath, filePath);
    const relativePath = path.relative(path.resolve(), path.resolve(fp)).replace(/\\/g, '/');

    if (hardCodedMain && (filePath === 'package.json' || filePath === './package.json')) {
      // read version from existing package.json
      return _readFile(fp)
      .then(buffer => JSON.parse(buffer.toString()))
      .then(
        meta => meta.version,
        () => 'N/A'
      )
      .then(version => ({
        path: relativePath,
        contents: JSON.stringify({name, version, main: hardCodedMain})
      }));
    }

    return _readFile(fp)
    .then(
      buffer => {
        return {
          path: relativePath,
          contents: buffer.toString(ext(filePath) === '.wasm' ? 'base64' : undefined)
        };
      },
      err => {
        if (filePath === 'package.json' || filePath === './package.json') {
          warn('No package.json found at ' + name + '/' + relativePath);
          const mock = `{"name":${JSON.stringify(name)},"main":"index"}`;
          info('Fall back to ' + mock);
          return {
            path: relativePath,
            contents: mock
          };
        }
        throw err;
      }
    ).then(unit => {
      if (filePath === 'package.json' || filePath === './package.json') {
        const meta = JSON.parse(unit.contents);
        if (meta.name !== name) {
          meta.name = name;
          unit.contents = JSON.stringify(meta);
        }
      }
      return unit;
    });
  });
}
