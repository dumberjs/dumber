const path = require('path');
const _defaultReader = require('../lib/package-file-reader/default');

function mockResolve(path) {
  return 'node_modules/' + path;
}

function buildReadFile(fakeFs = {}) {
  return p => {
    p = path.normalize(p).replace(/\\/g, '/');
    if (fakeFs.hasOwnProperty(p)) return Promise.resolve(fakeFs[p]);
    return Promise.reject('no file at ' + p);
  };
}

function mockPackageFileReader(fakeReader) {
  return packageConfig => _defaultReader(packageConfig, {resolve: mockResolve, readFile: fakeReader});
}

exports.mockResolve = mockResolve;
exports.buildReadFile = buildReadFile;
exports.mockPackageFileReader = mockPackageFileReader;
