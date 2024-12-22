const path = require('path');
const {contentOrFile} = require('../lib/shared');
const _defaultReader = require('../lib/package-file-reader/node');
const Bundler = require('../lib/index');

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

function mockContentOrFile(fakeReader) {
  return pathOrContent => contentOrFile(pathOrContent, {readFile: fakeReader});
}

function deleteSourceMap(file) {
  delete file.sourceMap;
}

function mockBundler(fakeFs = {}, opts = {}) {
  // don't use cache in test
  if (!opts.cache) opts.cache = false;
  const fakeReader = buildReadFile(fakeFs);
  opts.packageFileReader = mockPackageFileReader(fakeReader);

  const bundler = new Bundler(opts, {
    resolve: mockResolve,
    contentOrFile: mockContentOrFile(fakeReader)
  });

  const oldBundle = bundler.bundle.bind(bundler);
  bundler.bundle = function() {
    // don't test source map
    const bundleMap = oldBundle();
    Object.keys(bundleMap).forEach(key => {
      if (bundleMap[key].files) {
        bundleMap[key].files.forEach(deleteSourceMap);
      }
      if (bundleMap[key].appendFiles) {
        bundleMap[key].appendFiles.forEach(deleteSourceMap);
      }
    });
    return bundleMap;
  };
  return bundler;
}

exports.mockResolve = mockResolve;
exports.buildReadFile = buildReadFile;
exports.mockPackageFileReader = mockPackageFileReader;
exports.mockBundler = mockBundler;
