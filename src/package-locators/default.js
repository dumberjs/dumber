import path from 'path';
import {info, warn, resolvePackagePath, fsReadFile} from '../shared';
import {ext} from 'dumber-module-loader/dist/id-utils';

// default locator using nodejs to resolve package
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
      return Promise.resolve({
        path: relativePath,
        contents: JSON.stringify({name: name, main: hardCodedMain})
      });
    }

    return _readFile(fp)
    .then(
      buffer => {
        return {
          path: relativePath,
          contents: buffer.toString(ext(filePath) === '.wasm' ? 'base64' : null)
        };
      },
      err => {
        if (filePath === 'package.json' || filePath === './package.json') {
          warn('No package.json found at ' + relativePath);
          const mock = `{"name":${JSON.stringify(name)},"main":"index"}`;
          info('Fall back to ' + mock);
          return {
            path: relativePath,
            contents: mock
          };
        }
        throw err;
      }
    );
  });
}
