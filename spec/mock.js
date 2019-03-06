import path from 'path';
import _defaultReader from '../src/package-file-reader/default';

export function mockResolve(path) {
  return 'node_modules/' + path;
}

export function buildReadFile(fakeFs = {}) {
  return p => {
    p = path.normalize(p).replace(/\\/g, '/');
    if (fakeFs.hasOwnProperty(p)) return Promise.resolve(fakeFs[p]);
    return Promise.reject('no file at ' + p);
  };
}

export function mockPackageFileReader(fakeReader) {
  return packageConfig => _defaultReader(packageConfig, {resolve: mockResolve, readFile: fakeReader});
}
