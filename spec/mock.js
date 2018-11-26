import _defaultLocator from '../src/package-locators/default';

export function mockResolve(path) {
  return 'node_modules/' + path;
}

export function buildReadFile(fakeFs = {}) {
  return path => {
    if (fakeFs.hasOwnProperty(path)) return Promise.resolve(fakeFs[path]);
    return Promise.reject('no file at ' + path);
  };
}

export function mockLocator(fakeReader) {
  return packageConfig => _defaultLocator(packageConfig, {resolve: mockResolve, readFile: fakeReader});
}
