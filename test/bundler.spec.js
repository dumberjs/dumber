const test = require('tape');
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

test('Bundler traces files', t => {
  const fakeFs = {
    'local/setup.js': 'setup',
    'local/after.js': 'after',
    'node_modules/dumber-module-loader/dist/index.debug.js': 'dumber-module-loader',
    'node_modules/foo/package.json': JSON.stringify({name: 'foo', main: 'index'}),
    'node_modules/foo/index.js': "require('loo');",
    'node_modules/foo/bar.js': '',
    'node_modules/loo/package.json':  JSON.stringify({name: 'loo', main: './loo'}),
    'node_modules/loo/loo.js': '',
  };
  const bundler = createBundler(fakeFs, {
    prepends: ['var pre = 1;', '', undefined, false, 'local/setup.js', null],
    appends: ['local/after.js', 'var ape = 1;']
  });

  Promise.resolve()
  .then(() => bundler.capture({path: 'src/app.js', contents: "require('foo');require('page/one');", moduleId: 'app.js'}))
  .then(() => bundler.capture({path: 'src/page/one.js', contents: "require('foo/bar');require('loo');", moduleId: 'page/one.js'}))
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
              "contents": "define('app.js',['require','exports','module','foo','page/one'],function (require, exports, module) {\nrequire('foo');require('page/one');\n});\n"
            },
            {
              "path": "src/page/one.js",
              "contents": "define('page/one.js',['require','exports','module','foo/bar','loo'],function (require, exports, module) {\nrequire('foo/bar');require('loo');\n});\n"
            },
            {
              "contents": "define.switchToPackageSpace();"
            },
            {
              "path": "node_modules/foo/bar.js",
              "contents": ";\ndefine('foo/bar.js',function(){});\n"
            },
            {
              "path": "node_modules/foo/index.js",
              "contents": "define('foo/index.js',['require','exports','module','loo'],function (require, exports, module) {\nrequire('loo');\n});\n\n;define.alias('foo','foo/index.js');"
            },
            {
              "path": "node_modules/loo/loo.js",
              "contents": ";\ndefine('loo/loo.js',function(){});\n\n;define.alias('loo','loo/loo.js');"
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
  )
  .then(t.end);
});

test('Bundler can optionally skip dumber-module-loader', t => {
  const fakeFs = {
    'local/setup.js': 'setup',
    'local/after.js': 'after',

  };
  const bundler = createBundler(fakeFs, {
    skipModuleLoader: true,
    prepends: ['dev-dumber-module-loader']
  });

  Promise.resolve()
  .then(() => bundler.capture({path: 'src/app.js', contents: '', moduleId: 'app.js'}))
  .then(() => bundler.resolve())
  .then(() => bundler.bundle())
  .then(
    bundleMap => {
      t.deepEqual(bundleMap, {
        "entry-bundle": {
          "files": [
            {
              "contents": "dev-dumber-module-loader;"
            },
            {
              "contents": "define.switchToUserSpace();"
            },
            {
              "path": "src/app.js",
              "contents": ";\ndefine('app.js',function(){});\n"
            }
          ],
          "config": {
            "baseUrl": "/dist",
            "paths": {},
            "bundles": {}
          }
        }
      });
    },
    err => t.fail(err.stack)
  )
  .then(t.end);
});

test('Bundler traces files, split bundles', t => {
  const fakeFs = {
    'local/setup.js': 'setup',
    'local/after.js': 'after',
    'node_modules/dumber-module-loader/dist/index.debug.js': 'dumber-module-loader',
    'node_modules/foo/package.json': JSON.stringify({name: 'foo', main: 'index'}),
    'node_modules/foo/index.js': "require('loo');",
    'node_modules/foo/bar.js': '',
    'node_modules/loo/package.json':  JSON.stringify({name: 'loo', main: './loo'}),
    'node_modules/loo/loo.js': '',
  };
  const bundler = createBundler(fakeFs, {
    prepends: ['var pre = 1;', 'local/setup.js'],
    appends: ['local/after.js', 'var ape = 1;'],
    codeSplit: (moduleId, packageName) => {
      if (packageName) return 'vendor';
    }
  });

  Promise.resolve()
  .then(() => bundler.capture({path: 'src/app.js', contents: "require('foo');require('page/one');", moduleId: 'app.js'}))
  .then(() => bundler.capture({path: 'src/page/one.js', contents: "require('foo/bar');require('loo');", moduleId: 'page/one.js'}))
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
              "contents": "define('app.js',['require','exports','module','foo','page/one'],function (require, exports, module) {\nrequire('foo');require('page/one');\n});\n"
            },
            {
              "path": "src/page/one.js",
              "contents": "define('page/one.js',['require','exports','module','foo/bar','loo'],function (require, exports, module) {\nrequire('foo/bar');require('loo');\n});\n"
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
            "bundles": {
              "vendor": {
                "user": [],
                "package": [
                  "foo",
                  "foo/bar.js",
                  "foo/index.js",
                  "loo",
                  "loo/loo.js"
                ]
              }
            }
          }
        },
        "vendor": {
          "files": [
            {
              "contents": "define.switchToPackageSpace();"
            },
            {
              "path": "node_modules/foo/bar.js",
              "contents": ";\ndefine('foo/bar.js',function(){});\n"
            },
            {
              "path": "node_modules/foo/index.js",
              "contents": "define('foo/index.js',['require','exports','module','loo'],function (require, exports, module) {\nrequire('loo');\n});\n\n;define.alias('foo','foo/index.js');"
            },
            {
              "path": "node_modules/loo/loo.js",
              "contents": ";\ndefine('loo/loo.js',function(){});\n\n;define.alias('loo','loo/loo.js');"
            },
            {
              "contents": "define.switchToUserSpace();"
            }
          ]
        }
      });
    },
    err => t.fail(err.stack)
  )
  .then(t.end);
});

test('Bundler traces files, split bundles, case2', t => {
  const fakeFs = {
    'local/setup.js': 'setup',
    'local/after.js': 'after',
    'node_modules/dumber-module-loader/dist/index.debug.js': 'dumber-module-loader',
    'node_modules/foo/package.json': JSON.stringify({name: 'foo', main: 'index'}),
    'node_modules/foo/index.js': "require('loo');",
    'node_modules/foo/bar.js': '',
    'node_modules/loo/package.json':  JSON.stringify({name: 'loo', main: './loo'}),
    'node_modules/loo/loo.js': '',
  };
  const bundler = createBundler(fakeFs, {
    prepends: ['var pre = 1;', 'local/setup.js'],
    appends: ['local/after.js', 'var ape = 1;'],
    entryBundle: 'main',
    baseUrl: 'scripts',
    codeSplit: (moduleId, packageName) => {
      if (packageName) {
        if (packageName === 'loo') return 'app';
        return 'vendor';
      } else {
        return 'app';
      }
    }
  });

  Promise.resolve()
  .then(() => bundler.capture({path: 'src/app.js', contents: "require('foo');require('page/one');", moduleId: 'app.js'}))
  .then(() => bundler.capture({path: 'src/page/one.js', contents: "require('foo/bar');require('loo');", moduleId: 'page/one.js'}))
  .then(() => bundler.resolve())
  .then(() => bundler.bundle())
  .then(
    bundleMap => {
      t.deepEqual(bundleMap, {
        "main": {
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
            "baseUrl": "scripts",
            "paths": {},
            "bundles": {
              "app": {
                "user": [
                  "app.js",
                  "page/one.js"
                ],
                "package": [
                  "loo",
                  "loo/loo.js"
                ]
              },
              "vendor": {
                "user": [],
                "package": [
                  "foo",
                  "foo/bar.js",
                  "foo/index.js"
                ]
              }
            }
          }
        },
        "app": {
          "files": [
            {
              "contents": "define.switchToUserSpace();"
            },
            {
              "path": "src/app.js",
              "contents": "define('app.js',['require','exports','module','foo','page/one'],function (require, exports, module) {\nrequire('foo');require('page/one');\n});\n"
            },
            {
              "path": "src/page/one.js",
              "contents": "define('page/one.js',['require','exports','module','foo/bar','loo'],function (require, exports, module) {\nrequire('foo/bar');require('loo');\n});\n"
            },
            {
              "contents": "define.switchToPackageSpace();"
            },
            {
              "path": "node_modules/loo/loo.js",
              "contents": ";\ndefine('loo/loo.js',function(){});\n\n;define.alias('loo','loo/loo.js');"
            },
            {
              "contents": "define.switchToUserSpace();"
            }
          ]
        },
        "vendor": {
          "files": [
            {
              "contents": "define.switchToPackageSpace();"
            },
            {
              "path": "node_modules/foo/bar.js",
              "contents": ";\ndefine('foo/bar.js',function(){});\n"
            },
            {
              "path": "node_modules/foo/index.js",
              "contents": "define('foo/index.js',['require','exports','module','loo'],function (require, exports, module) {\nrequire('loo');\n});\n\n;define.alias('foo','foo/index.js');"
            },
            {
              "contents": "define.switchToUserSpace();"
            }
          ]
        }
      });
    },
    err => t.fail(err.stack)
  )
  .then(t.end);
});

test('Bundler traces files, sorts shim', t => {
  const fakeFs = {
    'node_modules/dumber-module-loader/dist/index.debug.js': 'dumber-module-loader',
    'node_modules/jquery/package.json': JSON.stringify({name: 'jquery', main: 'dist/jquery'}),
    'node_modules/jquery/dist/jquery.js': 'define("jquery",[],function(){});',
    'node_modules/bootstrap/package.json':  JSON.stringify({name: 'bootstrap', main: './dist/bootstrap'}),
    'node_modules/bootstrap/dist/bootstrap.js': '',
    'node_modules/fs-browser-stub/package.json': JSON.stringify({name: 'fs-browser-stub', main: 'index.js'}),
    'node_modules/fs-browser-stub/index.js': ''
  };
  const bundler = createBundler(fakeFs, {
    deps: [
      {name: 'bootstrap', deps: ['jquery'], 'exports': 'jQuery'}
    ]
  });

  Promise.resolve()
  .then(() => bundler.capture({path: 'src/app.js', contents: "require('fs');require('bootstrap');", moduleId: 'app.js'}))
  .then(() => bundler.resolve())
  .then(() => bundler.bundle())
  .then(
    bundleMap => {
      t.deepEqual(bundleMap, {
        "entry-bundle": {
          "files": [
            {
              "path": "node_modules/dumber-module-loader/dist/index.debug.js",
              "contents": "dumber-module-loader;"
            },
            {
              "contents": "define.switchToUserSpace();"
            },
            {
              "path": "src/app.js",
              "contents": "define('app.js',['require','exports','module','fs','bootstrap'],function (require, exports, module) {\nrequire('fs');require('bootstrap');\n});\n"
            },
            {
              "contents": "define.switchToPackageSpace();"
            },
            {
              "path": "node_modules/jquery/dist/jquery.js",
              "contents": "define(\"jquery\",[],function(){});"
            },
            {
              "path": "node_modules/bootstrap/dist/bootstrap.js",
              "contents": ";\ndefine('bootstrap/dist/bootstrap.js',['jquery'],(function (global) {\n  return function () {\n    return global.jQuery;\n  };\n}(this)));\n\n;define.alias('bootstrap','bootstrap/dist/bootstrap.js');"
            },
            {
              "path": "node_modules/fs-browser-stub/index.js",
              "contents": ";\ndefine('fs/index.js',function(){});\n\n;define.alias('fs','fs/index.js');"
            },
            {
              "contents": "define.switchToUserSpace();"
            }
          ],
          "config": {
            "baseUrl": "/dist",
            "paths": {},
            "bundles": {}
          }
        }
      });
    },
    err => t.fail(err.stack)
  )
  .then(t.end);
});

test('Bundler traces files, always sort jquery and moment on top', t => {
  const fakeFs = {
    'node_modules/dumber-module-loader/dist/index.debug.js': 'dumber-module-loader',
    'node_modules/jquery/package.json': JSON.stringify({name: 'jquery', main: 'dist/jquery'}),
    'node_modules/jquery/dist/jquery.js': 'define("jquery",[],function(){});',
    'node_modules/moment/package.json': JSON.stringify({name: 'moment', main: './moment'}),
    'node_modules/moment/moment.js': '',
    'node_modules/aaa/package.json':  JSON.stringify({name: 'aaa', main: './aaa'}),
    'node_modules/aaa/aaa.js': '',
  };
  const bundler = createBundler(fakeFs);

  Promise.resolve()
  .then(() => bundler.capture({path: 'src/app.js', contents: "require('aaa');require('jquery');require('moment');", moduleId: 'app.js'}))
  .then(() => bundler.resolve())
  .then(() => bundler.bundle())
  .then(
    bundleMap => {
      t.deepEqual(bundleMap, {
        "entry-bundle": {
          "files": [
            {
              "path": "node_modules/dumber-module-loader/dist/index.debug.js",
              "contents": "dumber-module-loader;"
            },
            {
              "contents": "define.switchToUserSpace();"
            },
            {
              "path": "src/app.js",
              "contents": "define('app.js',['require','exports','module','aaa','jquery','moment'],function (require, exports, module) {\nrequire('aaa');require('jquery');require('moment');\n});\n"
            },
            {
              "contents": "define.switchToPackageSpace();"
            },
            {
              "path": "node_modules/jquery/dist/jquery.js",
              "contents": "define(\"jquery\",[],function(){});"
            },
            {
              "path": "node_modules/moment/moment.js",
              "contents": ";\ndefine('moment/moment.js',function(){});\n\n;define.alias('moment','moment/moment.js');"
            },
            {
              "path": "node_modules/aaa/aaa.js",
              "contents": ";\ndefine('aaa/aaa.js',function(){});\n\n;define.alias('aaa','aaa/aaa.js');"
            },
            {
              "contents": "define.switchToUserSpace();"
            }
          ],
          "config": {
            "baseUrl": "/dist",
            "paths": {},
            "bundles": {}
          }
        }
      });
    },
    err => t.fail(err.stack)
  )
  .then(t.end);
});

test('Bundler ignores module when onRequire returns false', t => {
  const fakeFs = {
    'node_modules/dumber-module-loader/dist/index.debug.js': 'dumber-module-loader',
  };
  const bundler = createBundler(fakeFs, {
    onRequire(moduleId) {
      if (moduleId === 'foo') return false;
    }
  });

  Promise.resolve()
  .then(() => bundler.capture({path: 'src/app.js', contents: "require('foo');", moduleId: 'app.js'}))
  .then(() => bundler.resolve())
  .then(() => bundler.bundle())
  .then(
    bundleMap => {
      t.deepEqual(bundleMap, {
        "entry-bundle": {
          "files": [
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
            }
          ],
          "config": {
            "baseUrl": "/dist",
            "paths": {},
            "bundles": {}
          }
        }
      });
    },
    err => t.fail(err.stack)
  )
  .then(t.end);
});

test('Bundler replaces deps when onRequire returns array', t => {
  const fakeFs = {
    'node_modules/dumber-module-loader/dist/index.debug.js': 'dumber-module-loader',
    'node_modules/bar/package.json': '{"name":"bar"}',
    'node_modules/bar/index.js': '',
    'node_modules/loo/package.json': '{"name":"loo","main":"loo"}',
    'node_modules/loo/loo.js': '',
  };
  const bundler = createBundler(fakeFs, {
    onRequire(moduleId) {
      if (moduleId === 'foo') return ['bar', 'loo'];
    }
  });

  Promise.resolve()
  .then(() => bundler.capture({path: 'src/app.js', contents: "require('foo');", moduleId: 'app.js'}))
  .then(() => bundler.resolve())
  .then(() => bundler.bundle())
  .then(
    bundleMap => {
      t.deepEqual(bundleMap, {
        "entry-bundle": {
          "files": [
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
              "path": "node_modules/bar/index.js",
              "contents": ";\ndefine('bar/index.js',function(){});\n\n;define.alias('bar','bar/index.js');"
            },
            {
              "path": "node_modules/loo/loo.js",
              "contents": ";\ndefine('loo/loo.js',function(){});\n\n;define.alias('loo','loo/loo.js');"
            },
            {
              "contents": "define.switchToUserSpace();"
            }
          ],
          "config": {
            "baseUrl": "/dist",
            "paths": {},
            "bundles": {}
          }
        }
      });
    },
    err => t.fail(err.stack)
  )
  .then(t.end);
});

test('Bundler supports implementation returned by onRequire', t => {
  const fakeFs = {
    'node_modules/dumber-module-loader/dist/index.debug.js': 'dumber-module-loader',
    'node_modules/loo/package.json': '{"name":"loo","main":"loo"}',
    'node_modules/loo/loo.js': '',
  };
  const bundler = createBundler(fakeFs, {
    onRequire(moduleId) {
      // onRequire can return a Promise to resolve to false, array, or string.
      if (moduleId === 'foo') return Promise.resolve("require('loo');");
    }
  });

  Promise.resolve()
  .then(() => bundler.capture({path: 'src/app.js', contents: "require('foo');", moduleId: 'app.js'}))
  .then(() => bundler.resolve())
  .then(() => bundler.bundle())
  .then(
    bundleMap => {
      t.deepEqual(bundleMap, {
        "entry-bundle": {
          "files": [
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
              "path": "__on_require__/foo.js",
              "contents": "define('foo',['require','exports','module','loo'],function (require, exports, module) {\nrequire('loo');\n});\n"
            },
            {
              "path": "node_modules/loo/loo.js",
              "contents": ";\ndefine('loo/loo.js',function(){});\n\n;define.alias('loo','loo/loo.js');"
            },
            {
              "contents": "define.switchToUserSpace();"
            }
          ],
          "config": {
            "baseUrl": "/dist",
            "paths": {},
            "bundles": {}
          }
        }
      });
    },
    err => t.fail(err.stack)
  )
  .then(t.end);
});

test('Bundler swallows onRequire exception', t => {
  const fakeFs = {
    'node_modules/dumber-module-loader/dist/index.debug.js': 'dumber-module-loader',
    'node_modules/foo/package.json': '{"name":"foo","main":"foo"}',
    'node_modules/foo/foo.js': '',
  };
  const bundler = createBundler(fakeFs, {
    onRequire(moduleId) {
      if (moduleId === 'foo') throw new Error("haha");
    }
  });

  Promise.resolve()
  .then(() => bundler.capture({path: 'src/app.js', contents: "require('foo');", moduleId: 'app.js'}))
  .then(() => bundler.resolve())
  .then(() => bundler.bundle())
  .then(
    bundleMap => {
      t.deepEqual(bundleMap, {
        "entry-bundle": {
          "files": [
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
              "path": "node_modules/foo/foo.js",
              "contents": ";\ndefine('foo/foo.js',function(){});\n\n;define.alias('foo','foo/foo.js');"
            },
            {
              "contents": "define.switchToUserSpace();"
            }
          ],
          "config": {
            "baseUrl": "/dist",
            "paths": {},
            "bundles": {}
          }
        }
      });
    },
    err => t.fail(err.stack)
  )
  .then(t.end);
});

test('Bundler swallows onRequire promise rejection', t => {
  const fakeFs = {
    'node_modules/dumber-module-loader/dist/index.debug.js': 'dumber-module-loader',
    'node_modules/foo/package.json': '{"name":"foo","main":"foo"}',
    'node_modules/foo/foo.js': '',
  };
  const bundler = createBundler(fakeFs, {
    onRequire(moduleId) {
      if (moduleId === 'foo') return Promise.reject(new Error("haha"));
    }
  });

  Promise.resolve()
  .then(() => bundler.capture({path: 'src/app.js', contents: "require('foo');", moduleId: 'app.js'}))
  .then(() => bundler.resolve())
  .then(() => bundler.bundle())
  .then(
    bundleMap => {
      t.deepEqual(bundleMap, {
        "entry-bundle": {
          "files": [
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
              "path": "node_modules/foo/foo.js",
              "contents": ";\ndefine('foo/foo.js',function(){});\n\n;define.alias('foo','foo/foo.js');"
            },
            {
              "contents": "define.switchToUserSpace();"
            }
          ],
          "config": {
            "baseUrl": "/dist",
            "paths": {},
            "bundles": {}
          }
        }
      });
    },
    err => t.fail(err.stack)
  )
  .then(t.end);
});

test('Bundler can use cache', t => {
  const bundler = createBundler({}, {cache: true});
  t.ok(bundler._cache);
  t.end();
});

test('Bundler can turn off cache', t => {
  const bundler = createBundler({}, {cache: false});
  t.notOk(bundler._cache);
  t.end();
});

test('Bundler can customise cache implementation', t => {
  const getCache = () => {};
  const setCache = () => {};
  const clearCache = () => {};
  const bundler = createBundler({}, {cache: {getCache, setCache, clearCache}});
  t.deepEqual(bundler._cache, {getCache, setCache, clearCache});
  t.end();
});

test('Bundler traces files, split bundles, continuously update bundles in watch mode', t => {
  const fakeFs = {
    'node_modules/dumber-module-loader/dist/index.debug.js': 'dumber-module-loader',
    'node_modules/foo/package.json': JSON.stringify({name: 'foo', main: 'index'}),
    'node_modules/foo/index.js': '',
    'node_modules/foo/bar.js': '',
    'node_modules/loo/package.json':  JSON.stringify({name: 'loo', main: './loo'}),
    'node_modules/loo/loo.js': '',
  };
  const bundler = createBundler(fakeFs, {
    codeSplit: (moduleId, packageName) => {
      if (packageName) {
        if (packageName !== 'loo') return 'vendor-bundle';
      } else {
        if (moduleId.startsWith('page/')) return 'page-bundle';
        return 'app-bundle';
      }
    }
  });

  Promise.resolve()
  .then(() => bundler.capture({path: 'src/app.js', contents: "require('foo');require('page/one');", moduleId: 'app.js'}))
  .then(() => bundler.capture({path: 'src/page/one.js', contents: '', moduleId: 'page/one.js'}))
  .then(() => bundler.resolve())
  .then(() => bundler.bundle())
  .then(
    bundleMap => {
      t.deepEqual(bundleMap, {
        "entry-bundle": {
          "files": [
            {
              "path": "node_modules/dumber-module-loader/dist/index.debug.js",
              "contents": "dumber-module-loader;"
            }
          ],
          "config": {
            "baseUrl": "/dist",
            "paths": {},
            "bundles": {
              "app-bundle": {
                "user": [
                  "app.js"
                ],
                "package": []
              },
              "page-bundle": {
                "user": [
                  "page/one.js"
                ],
                "package": []
              },
              "vendor-bundle": {
                "user": [],
                "package": [
                  "foo",
                  "foo/index.js"
                ]
              }
            }
          }
        },
        "app-bundle": {
          "files": [
            {
              "contents": "define.switchToUserSpace();"
            },
            {
              "path": "src/app.js",
              "contents": "define('app.js',['require','exports','module','foo','page/one'],function (require, exports, module) {\nrequire('foo');require('page/one');\n});\n"
            }
          ]
        },
        "page-bundle": {
          "files": [
            {
              "contents": "define.switchToUserSpace();"
            },
            {
              "path": "src/page/one.js",
              "contents": ";\ndefine('page/one.js',function(){});\n"
            }
          ]
        },
        "vendor-bundle": {
          "files": [
            {
              "contents": "define.switchToPackageSpace();"
            },
            {
              "path": "node_modules/foo/index.js",
              "contents": ";\ndefine('foo/index.js',function(){});\n\n;define.alias('foo','foo/index.js');"
            },
            {
              "contents": "define.switchToUserSpace();"
            }
          ]
        }
      });
    },
    err => t.fail(err.stack)
  )
  .then(() => bundler.capture({path: 'src/page/one.js', contents: "require('foo/bar');require('loo');", moduleId: 'page/one.js'}))
  .then(() => bundler.resolve())
  .then(() => bundler.bundle())
  .then(
    bundleMap => {
      t.deepEqual(bundleMap, {
        "entry-bundle": {
          "files": [
            {
              "path": "node_modules/dumber-module-loader/dist/index.debug.js",
              "contents": "dumber-module-loader;"
            },
            {
              "contents": "define.switchToPackageSpace();"
            },
            {
              "path": "node_modules/loo/loo.js",
              "contents": ";\ndefine('loo/loo.js',function(){});\n\n;define.alias('loo','loo/loo.js');"
            },
            {
              "contents": "define.switchToUserSpace();"
            }
          ],
          "config": {
            "baseUrl": "/dist",
            "paths": {},
            "bundles": {
              "app-bundle": {
                "user": [
                  "app.js"
                ],
                "package": []
              },
              "page-bundle": {
                "user": [
                  "page/one.js"
                ],
                "package": []
              },
              "vendor-bundle": {
                "user": [],
                "package": [
                  "foo",
                  "foo/bar.js",
                  "foo/index.js"
                ]
              }
            }
          }
        },
        "page-bundle": {
          "files": [
            {
              "contents": "define.switchToUserSpace();"
            },
            {
              "path": "src/page/one.js",
              "contents": "define('page/one.js',['require','exports','module','foo/bar','loo'],function (require, exports, module) {\nrequire('foo/bar');require('loo');\n});\n"
            }
          ]
        },
        "vendor-bundle": {
          "files": [
            {
              "contents": "define.switchToPackageSpace();"
            },
            {
              "path": "node_modules/foo/bar.js",
              "contents": ";\ndefine('foo/bar.js',function(){});\n"
            },
            {
              "path": "node_modules/foo/index.js",
              "contents": ";\ndefine('foo/index.js',function(){});\n\n;define.alias('foo','foo/index.js');"
            },
            {
              "contents": "define.switchToUserSpace();"
            }
          ]
        }
      });
    },
    err => t.fail(err.stack)
  )
  .then(() => bundler.capture({path: 'src/goo.js', contents: '', moduleId: 'goo.js'}))
  .then(() => bundler.capture({path: 'src/goo2.js', contents: '', moduleId: 'goo2.js'}))
  .then(() => bundler.resolve())
  .then(() => bundler.bundle())
  .then(
    bundleMap => {
      t.deepEqual(bundleMap, {
        "entry-bundle": {
          "files": [
            {
              "path": "node_modules/dumber-module-loader/dist/index.debug.js",
              "contents": "dumber-module-loader;"
            },
            {
              "contents": "define.switchToPackageSpace();"
            },
            {
              "path": "node_modules/loo/loo.js",
              "contents": ";\ndefine('loo/loo.js',function(){});\n\n;define.alias('loo','loo/loo.js');"
            },
            {
              "contents": "define.switchToUserSpace();"
            }
          ],
          "config": {
            "baseUrl": "/dist",
            "paths": {},
            "bundles": {
              "app-bundle": {
                "user": [
                  "app.js",
                  "goo.js",
                  "goo2.js"
                ],
                "package": []
              },
              "page-bundle": {
                "user": [
                  "page/one.js"
                ],
                "package": []
              },
              "vendor-bundle": {
                "user": [],
                "package": [
                  "foo",
                  "foo/bar.js",
                  "foo/index.js"
                ]
              }
            }
          }
        },
        "app-bundle": {
          "files": [
            {
              "contents": "define.switchToUserSpace();"
            },
            {
              "path": "src/app.js",
              "contents": "define('app.js',['require','exports','module','foo','page/one'],function (require, exports, module) {\nrequire('foo');require('page/one');\n});\n"
            },
            {
              "path": "src/goo.js",
              "contents": ";\ndefine('goo.js',function(){});\n"
            },
            {
              "path": "src/goo2.js",
              "contents": ";\ndefine('goo2.js',function(){});\n"
            }
          ]
        }
      });
    },
    err => t.fail(err.stack)
  )
  .then(t.end);
});

test('Bundler supports inject css by default', t => {
  const fakeFs = {
    'node_modules/dumber-module-loader/dist/index.debug.js': 'dumber-module-loader',
    'node_modules/dumber/package.json':  JSON.stringify({name: 'dumber', main: './dist/index'}),
    'node_modules/dumber/lib/inject-css.js': '',
  };
  const bundler = createBundler(fakeFs, {
  });

  Promise.resolve()
  .then(() => bundler.capture({path: 'src/app.js', contents: "require('c.css')", moduleId: 'app.js'}))
  .then(() => bundler.capture({path: 'src/c.css', contents: 'lorem', moduleId: 'c.css'}))
  .then(() => bundler.resolve())
  .then(() => bundler.bundle())
  .then(
    bundleMap => {
      t.deepEqual(bundleMap, {
        "entry-bundle": {
          "files": [
            {
              "path": "node_modules/dumber-module-loader/dist/index.debug.js",
              "contents": "dumber-module-loader;"
            },
            {
              "contents": "define.switchToUserSpace();"
            },
            {
              "path": "src/app.js",
              "contents": "define('app.js',['require','exports','module','c.css'],function (require, exports, module) {\nrequire('c.css')\n});\n"
            },
            {
              "path": "src/c.css",
              "contents": "define('text!c.css',function(){return \"lorem\";});"
            },
            {
              "path": "__stub__/ext-css.js",
              "contents": "define('ext:css',['dumber/lib/inject-css'],function(m){return m;});\n;define.alias('ext:less','ext:css');\n;define.alias('ext:scss','ext:css');\n;define.alias('ext:sass','ext:css');\n;define.alias('ext:styl','ext:css');"
            },
            {
              "contents": "define.switchToPackageSpace();"
            },
            {
              "path": "node_modules/dumber/lib/inject-css.js",
              "contents": ";\ndefine('dumber/lib/inject-css.js',function(){});\n"
            },
            {
              "contents": "define.switchToUserSpace();"
            }
          ],
          "config": {
            "baseUrl": "/dist",
            "paths": {},
            "bundles": {}
          }
        }
      });
    },
    err => t.fail(err.stack)
  )
  .then(t.end);
});

test('Bundler supports inject css (relative path) by default', t => {
  const fakeFs = {
    'node_modules/dumber-module-loader/dist/index.debug.js': 'dumber-module-loader',
    'node_modules/dumber/package.json':  JSON.stringify({name: 'dumber', main: './dist/index'}),
    'node_modules/dumber/lib/inject-css.js': '',
  };
  const bundler = createBundler(fakeFs, {
  });

  Promise.resolve()
  .then(() => bundler.capture({path: 'src/app.js', contents: "require('./c.scss')", moduleId: 'app.js'}))
  .then(() => bundler.capture({path: 'src/c.css', contents: 'lorem', moduleId: 'c.css'}))
  .then(() => bundler.resolve())
  .then(() => bundler.bundle())
  .then(
    bundleMap => {
      t.deepEqual(bundleMap, {
        "entry-bundle": {
          "files": [
            {
              "path": "node_modules/dumber-module-loader/dist/index.debug.js",
              "contents": "dumber-module-loader;"
            },
            {
              "contents": "define.switchToUserSpace();"
            },
            {
              "path": "src/app.js",
              "contents": "define('app.js',['require','exports','module','./c.scss'],function (require, exports, module) {\nrequire('./c.scss')\n});\n"
            },
            {
              "path": "src/c.css",
              "contents": "define('text!c.css',function(){return \"lorem\";});"
            },
            {
              "path": "__stub__/ext-css.js",
              "contents": "define('ext:css',['dumber/lib/inject-css'],function(m){return m;});\n;define.alias('ext:less','ext:css');\n;define.alias('ext:scss','ext:css');\n;define.alias('ext:sass','ext:css');\n;define.alias('ext:styl','ext:css');"
            },
            {
              "contents": "define.switchToPackageSpace();"
            },
            {
              "path": "node_modules/dumber/lib/inject-css.js",
              "contents": ";\ndefine('dumber/lib/inject-css.js',function(){});\n"
            },
            {
              "contents": "define.switchToUserSpace();"
            }
          ],
          "config": {
            "baseUrl": "/dist",
            "paths": {},
            "bundles": {}
          }
        }
      });
    },
    err => t.fail(err.stack)
  )
  .then(t.end);
});

test('Bundler can optionally turn off inject css', t => {
  const fakeFs = {
    'node_modules/dumber-module-loader/dist/index.debug.js': 'dumber-module-loader',
    'node_modules/dumber/package.json':  JSON.stringify({name: 'dumber', main: './dist/index'}),
    'node_modules/dumber/lib/inject-css.js': '',
  };
  const bundler = createBundler(fakeFs, {
    injectCss: false
  });

  Promise.resolve()
  .then(() => bundler.capture({path: 'src/app.js', contents: "require('c.css')", moduleId: 'app.js'}))
  .then(() => bundler.capture({path: 'src/c.css', contents: 'lorem', moduleId: 'c.css'}))
  .then(() => bundler.resolve())
  .then(() => bundler.bundle())
  .then(
    bundleMap => {
      t.deepEqual(bundleMap, {
        "entry-bundle": {
          "files": [
            {
              "path": "node_modules/dumber-module-loader/dist/index.debug.js",
              "contents": "dumber-module-loader;"
            },
            {
              "contents": "define.switchToUserSpace();"
            },
            {
              "path": "src/app.js",
              "contents": "define('app.js',['require','exports','module','c.css'],function (require, exports, module) {\nrequire('c.css')\n});\n"
            },
            {
              "path": "src/c.css",
              "contents": "define('text!c.css',function(){return \"lorem\";});"
            }
          ],
          "config": {
            "baseUrl": "/dist",
            "paths": {},
            "bundles": {}
          }
        }
      });
    },
    err => t.fail(err.stack)
  )
  .then(t.end);
});

test('Bundler traces files with paths mapping', t => {
  const fakeFs = {
    'node_modules/dumber-module-loader/dist/index.debug.js': 'dumber-module-loader',
    'node_modules/foo/package.json': JSON.stringify({name: 'foo', main: 'index'}),
    'node_modules/foo/index.js': "require('loo');",
    'node_modules/bar/package.json': JSON.stringify({name: 'bar', main: 'index'}),
    'node_modules/bar/index.js': 'exports.bar = 1;',
    'node_modules/bar/el.js': 'exports.el = 1;',
  };
  const bundler = createBundler(fakeFs, {
    paths: {
      'foo': 'common/foo',
      'el': 'bar/el',
      '../src': ''
    }
  });

  Promise.resolve()
  .then(() => bundler.capture({path: 'src/app.js', contents: "import 'el!foo';", moduleId: 'app.js'}))
  .then(() => bundler.capture({path: 'src/common/foo.js', contents: '', moduleId: 'common/foo.js'}))
  .then(() => bundler.capture({path: 'test/app.spec.js', contents: "import '../src/app';", moduleId: '../test/app.spec.js'}))
  .then(() => bundler.resolve())
  .then(() => bundler.bundle())
  .then(
    bundleMap => {
      t.deepEqual(bundleMap, {
        "entry-bundle": {
          "files": [
            {
              "path": "node_modules/dumber-module-loader/dist/index.debug.js",
              "contents": "dumber-module-loader;"
            },
            {
              "contents": "define.switchToUserSpace();"
            },
            {
              "path": "test/app.spec.js",
              "contents": "define('../test/app.spec.js',['require','exports','module','../src/app'],function (require, exports, module) {\n\"use strict\";\n\nrequire(\"../src/app\");\n});\n"
            },
            {
              "path": "src/app.js",
              "contents": "define('app.js',['require','exports','module','el!foo'],function (require, exports, module) {\n\"use strict\";\n\nrequire(\"el!foo\");\n});\n"
            },
            {
              "path": "src/common/foo.js",
              "contents": ";\ndefine('common/foo.js',function(){});\n"
            },
            {
              "contents": "define.switchToPackageSpace();"
            },
            {
              "path": "node_modules/bar/el.js",
              "contents": "define('bar/el.js',['require','exports','module'],function (require, exports, module) {\nexports.el = 1;\n});\n"
            },
            {
              "contents": "define.switchToUserSpace();"
            }
          ],
          "config": {
            "baseUrl": "/dist",
            "paths": {
              "foo": "common/foo",
              "el": "bar/el",
              "../src": ""
            },
            "bundles": {}
          }
        }
      });
    },
    err => t.fail(err.stack)
  )
  .then(t.end);
});

test('Bundler allows same modules in both user and package space', t => {
  const fakeFs = {
    'node_modules/dumber-module-loader/dist/index.debug.js': 'dumber-module-loader',
    'node_modules/foo/package.json': JSON.stringify({name: 'foo', main: 'index'}),
    'node_modules/foo/index.js': "require('util');",
    'node_modules/foo/bar.js': 'exports.bar = 1;',
    'node_modules/util/package.json':  JSON.stringify({name: 'util', main: './util'}),
    'node_modules/util/util.js': 'exports.util = 1;',
  };
  const bundler = createBundler(fakeFs);

  Promise.resolve()
  .then(() => bundler.capture({path: 'src/app.js', contents: "import 'foo';\nimport './util'", moduleId: 'app.js'}))
  .then(() => bundler.capture({path: 'src/util.js', contents: 'export default function(){}', moduleId: 'util.js'}))
  .then(() => bundler.resolve())
  .then(() => bundler.bundle())
  .then(
    bundleMap => {
      t.deepEqual(bundleMap, {
        "entry-bundle": {
          "files": [
            {
              "path": "node_modules/dumber-module-loader/dist/index.debug.js",
              "contents": "dumber-module-loader;"
            },
            {
              "contents": "define.switchToUserSpace();"
            },
            {
              "path": "src/app.js",
              "contents": "define('app.js',['require','exports','module','foo','./util'],function (require, exports, module) {\n\"use strict\";\n\nrequire(\"foo\");\n\nrequire(\"./util\");\n});\n"
            },
            {
              "path": "src/util.js",
              "contents": "define('util.js',['require','exports','module'],function (require, exports, module) {\n\"use strict\";\n\nexports.__esModule = true;\nexports.default = _default;\n\nfunction _default() {}\n});\n"
            },
            {
              "contents": "define.switchToPackageSpace();"
            },
            {
              "path": "node_modules/foo/index.js",
              "contents": "define('foo/index.js',['require','exports','module','util'],function (require, exports, module) {\nrequire('util');\n});\n\n;define.alias('foo','foo/index.js');"
            },
            {
              "path": "node_modules/util/util.js",
              "contents": "define('util/util.js',['require','exports','module'],function (require, exports, module) {\nexports.util = 1;\n});\n\n;define.alias('util','util/util.js');"
            },
            {
              "contents": "define.switchToUserSpace();"
            }
          ],
          "config": {
            "baseUrl": "/dist",
            "paths": {},
            "bundles": {}
          }
        }
      });
    },
    err => t.fail(err.stack)
  )
  .then(t.end);
});

test('Bundler supports deps alias', t => {
  const fakeFs = {
    'node_modules/dumber-module-loader/dist/index.debug.js': 'dumber-module-loader',
    'node_modules/foo/package.json': JSON.stringify({name: 'foo', main: 'index'}),
    'node_modules/foo/index.js': 'exports.foo = 1;',
    'node_modules/foo/bar.js': 'exports.bar = 1;'
  };
  const bundler = createBundler(fakeFs, {
    cache: false,
    deps: [{
      name: 'bar',
      location: 'node_modules/foo'
    }]
  });

  Promise.resolve()
  .then(() => bundler.capture({path: 'src/app.js', contents: "import 'bar';", moduleId: 'app.js'}))
  .then(() => bundler.capture({path: 'src/foo.js', contents: "import 'bar/bar';", moduleId: 'foo.js'}))
  .then(() => bundler.resolve())
  .then(() => bundler.bundle())
  .then(
    bundleMap => {
      t.deepEqual(bundleMap, {
        "entry-bundle": {
          "files": [
            {
              "path": "node_modules/dumber-module-loader/dist/index.debug.js",
              "contents": "dumber-module-loader;"
            },
            {
              "contents": "define.switchToUserSpace();"
            },
            {
              "path": "src/app.js",
              "contents": "define('app.js',['require','exports','module','bar'],function (require, exports, module) {\n\"use strict\";\n\nrequire(\"bar\");\n});\n"
            },
            {
              "path": "src/foo.js",
              "contents": "define('foo.js',['require','exports','module','bar/bar'],function (require, exports, module) {\n\"use strict\";\n\nrequire(\"bar/bar\");\n});\n"
            },
            {
              "contents": "define.switchToPackageSpace();"
            },
            {
              "path": "node_modules/foo/bar.js",
              "contents": "define('bar/bar.js',['require','exports','module'],function (require, exports, module) {\nexports.bar = 1;\n});\n"
            },
            {
              "path": "node_modules/foo/index.js",
              "contents": "define('bar/index.js',['require','exports','module'],function (require, exports, module) {\nexports.foo = 1;\n});\n\n;define.alias('bar','bar/index.js');"
            },
            {
              "contents": "define.switchToUserSpace();"
            }
          ],
          "config": {
            "baseUrl": "/dist",
            "paths": {},
            "bundles": {}
          }
        }
      });
    },
    err => t.fail(err.stack)
  )
  .then(t.end);
});

test('Bundler supports package alias with lazyMain mode', t => {
  const fakeFs = {
    'node_modules/dumber-module-loader/dist/index.debug.js': 'dumber-module-loader',
    'node_modules/foo/package.json': JSON.stringify({name: 'foo', main: 'index'}),
    'node_modules/foo/index.js': 'exports.foo = 1;',
    'node_modules/foo/bar.js': 'exports.bar = 1;'
  };
  const bundler = createBundler(fakeFs, {
    deps: [{
      name: 'bar',
      location: 'node_modules/foo',
      lazyMain: true
    }]
  });

  Promise.resolve()
  .then(() => bundler.capture({path: 'src/app.js', contents: "import 'bar/bar';", moduleId: 'app.js'}))
  .then(() => bundler.resolve())
  .then(() => bundler.bundle())
  .then(
    bundleMap => {
      t.deepEqual(bundleMap, {
        "entry-bundle": {
          "files": [
            {
              "path": "node_modules/dumber-module-loader/dist/index.debug.js",
              "contents": "dumber-module-loader;"
            },
            {
              "contents": "define.switchToUserSpace();"
            },
            {
              "path": "src/app.js",
              "contents": "define('app.js',['require','exports','module','bar/bar'],function (require, exports, module) {\n\"use strict\";\n\nrequire(\"bar/bar\");\n});\n"
            },
            {
              "contents": "define.switchToPackageSpace();"
            },
            {
              "path": "node_modules/foo/bar.js",
              "contents": "define('bar/bar.js',['require','exports','module'],function (require, exports, module) {\nexports.bar = 1;\n});\n"
            },
            {
              "contents": "define.switchToUserSpace();"
            }
          ],
          "config": {
            "baseUrl": "/dist",
            "paths": {},
            "bundles": {}
          }
        }
      });
    },
    err => t.fail(err.stack)
  )
  .then(t.end);
});

test('Bundler creates correct alias for named AMD module which does not match package name', t => {
  const fakeFs = {
    'node_modules/dumber-module-loader/dist/index.debug.js': 'dumber-module-loader',
    'node_modules/noty/package.json': JSON.stringify({name: 'noty', main: 'lib/noty.js'}),
    'node_modules/noty/lib/noty.js': 'define("Noty",[],function(){});',
  };
  const bundler = createBundler(fakeFs);

  Promise.resolve()
  .then(() => bundler.capture({path: 'src/app.js', contents: "require('noty');", moduleId: 'app.js'}))
  .then(() => bundler.resolve())
  .then(() => bundler.bundle())
  .then(
    bundleMap => {
      t.deepEqual(bundleMap, {
        "entry-bundle": {
          "files": [
            {
              "path": "node_modules/dumber-module-loader/dist/index.debug.js",
              "contents": "dumber-module-loader;"
            },
            {
              "contents": "define.switchToUserSpace();"
            },
            {
              "path": "src/app.js",
              "contents": "define('app.js',['require','exports','module','noty'],function (require, exports, module) {\nrequire('noty');\n});\n"
            },
            {
              "contents": "define.switchToPackageSpace();"
            },
            {
              "path": "node_modules/noty/lib/noty.js",
              "contents": "define(\"Noty\",[],function(){});\n;define.alias('noty','Noty');"
            },
            {
              "contents": "define.switchToUserSpace();"
            }
          ],
          "config": {
            "baseUrl": "/dist",
            "paths": {},
            "bundles": {}
          }
        }
      });
    },
    err => t.fail(err.stack)
  )
  .then(t.end);
});
