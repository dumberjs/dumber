const {test} = require('zora');
const Bundler = require('../lib/index');
const {contentOrFile} = require('../lib/shared');
const {mockResolve, buildReadFile, mockPackageFileReader} = require('./mock');

function mockContentOrFile(fakeReader) {
  return pathOrContent => contentOrFile(pathOrContent, {readFile: fakeReader});
}

function deleteSourceMap(file) {
  delete file.sourceMap;
}

function createBundler(fakeFs = {}, opts = {}) {
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

test('Bundler traces mixed mjs and cjs npm packages', async t => {
  const fakeFs = {
    'local/setup.js': 'setup',
    'local/after.js': 'after',
    'node_modules/dumber-module-loader/dist/index.debug.js': 'dumber-module-loader',
    'node_modules/foo/package.json': JSON.stringify({name: 'foo', main: 'index.cjs'}),
    'node_modules/foo/index.cjs': "require('loo');",
    'node_modules/loo/package.json':  JSON.stringify({name: 'loo', main: './loo.mjs'}),
    'node_modules/loo/loo.mjs': '',
  };
  const bundler = createBundler(fakeFs, {
    prepends: ['var pre = 1;', '', undefined, false, 'local/setup.js', null],
    appends: ['local/after.js', 'var ape = 1;']
  });

  return Promise.resolve()
  .then(() => bundler.capture({path: 'src/app.js', contents: "require('foo');", moduleId: 'app.js'}))
  .then(() => bundler.resolve())
  .then(() => bundler.bundle())
  .then(
    bundleMap => {
      t.deepEqual(bundleMap, {
        "entry-bundle": {
          "files": [
            {
              "contents": "var pre = 1;"
            },
            {
              "path": "local/setup.js",
              "contents": "setup;"
            },
            {
              "path": "node_modules/dumber-module-loader/dist/index.debug.js",
              "contents": "dumber-module-loader;"
            },
            {
              "contents": "define.switchToUserSpace();"
            },
            {
              "path": "src/app.js",
              "contents": "define('app.js',['require','exports','module','foo'],function (require, exports, module) {\nrequire('foo');\n});\n"
            },
            {
              "contents": "define.switchToPackageSpace();"
            },
            {
              "path": "node_modules/foo/index.cjs",
              "contents": "define('foo/index.cjs',['require','exports','module','loo'],function (require, exports, module) {\nrequire('loo');\n});\n\n;define.alias('foo','foo/index.cjs');"
            },
            {
              "path": "node_modules/loo/loo.mjs",
              "contents": "define('loo/loo.mjs',['require','exports','module'],function (require, exports, module) {\n\n});\n\n;define.alias('loo','loo/loo.mjs');"
            },
            {
              "contents": "define.switchToUserSpace();"
            }
          ],
          "appendFiles": [
            {
              "path": "local/after.js",
              "contents": "after;"
            },
            {
              "contents": "var ape = 1;"
            }
          ],
          "config": {
            "baseUrl": "/dist",
            "paths": {},
            "bundles": {}
          }
        }
      })
    },
    err => t.fail(err.stack)
  );
});
