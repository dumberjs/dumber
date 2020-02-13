const path = require('path');
const _defaultReader = require('../lib/package-file-reader/node');

function mockResolve(path) {
  return 'node_modules/' + path;
}

function buildReadFile(fakeFs = {}) {
  const fileRead = p => {
    p = path.normalize(p).replace(/\\/g, '/');
    if (fakeFs.hasOwnProperty(p)) return Promise.resolve(fakeFs[p]);
    return Promise.reject('no file at ' + p);
  };

  const exists = p => {
    p = path.normalize(p).replace(/\\/g, '/');
    return Promise.resolve(fakeFs.hasOwnProperty(p));
  }

  fileRead.exists = exists;
  return fileRead;
}

function mockPackageFileReader(fakeReader) {
  return packageConfig => _defaultReader(packageConfig, {resolve: mockResolve, readFile: fakeReader, exists: fakeReader.exists});
}

exports.mockResolve = mockResolve;
exports.buildReadFile = buildReadFile;
exports.mockPackageFileReader = mockPackageFileReader;
