import path from 'path';
import {resolvePackagePath, fsReadFile} from '../shared';

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
    const relativePath = path.relative(path.resolve(), path.resolve(fp));

    if (hardCodedMain && (filePath === 'package.json' || filePath === './package.json')) {
      return Promise.resolve({
        path: relativePath,
        contents: JSON.stringify({name: name, main: hardCodedMain})
      });
    }

    return _readFile(fp)
    .then(buffer => {
      return {
        path: relativePath,
        contents: buffer.toString()
      };
    });
  });
}
