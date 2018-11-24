import fs from 'fs';
import path from 'path';

const fsReadFile = filePath => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) reject(err);
      resolve(data);
    });
  })
}

// default locator using nodejs to resolve package
export default function (packageConfig, mock) {
  let name = packageConfig.name;
  // decoupling for testing
  let _resolve = (mock && mock.resolve) || require.resolve;
  let _readFile = (mock && mock.readFile) || fsReadFile;
  let packagePath;
  let hardCodedMain = packageConfig.main;

  if (packageConfig.location) {
    packagePath = packageConfig.location;
  } else {
    try {
      let metaPath = _resolve(name + '/package.json');
      packagePath = metaPath.substr(0, metaPath.length - 13);
    } catch (e) {
      return Promise.reject(new Error('cannot find npm package: ' + name));
    }
  }

  return Promise.resolve(filePath => {
    const fp = path.join(packagePath, filePath);

    if (hardCodedMain && (filePath === 'package.json' || filePath === './package.json')) {
      return Promise.resolve({
        path: path.resolve(fp),
        contents: JSON.stringify({name: name, main: hardCodedMain})
      });
    }

    return _readFile(fp)
    .then(buffer => {
      return {
        path: path.resolve(fp),
        contents: buffer.toString()
      };
    });
  });
}
