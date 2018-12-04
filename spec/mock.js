import path from 'path';
import _defaultLocator from '../src/package-locators/default';

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

export function mockLocator(fakeReader) {
  return packageConfig => _defaultLocator(packageConfig, {resolve: mockResolve, readFile: fakeReader});
}
