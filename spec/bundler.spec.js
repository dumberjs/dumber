import test from 'tape';
import Bundler from '../src/index';
import {contentOrFile} from '../src/shared';
import {mockResolve, buildReadFile, mockLocator} from './mock';

function mockTrace(unit) {
  const contents = unit.contents;
  const moduleId = unit.moduleId;
  const shim = unit.shim;

  if (unit.packageName === 'jquery') {
    return Promise.resolve({
      path: unit.path,
      contents,
      sourceMap: unit.sourceMap,
      moduleId,
      defined: 'jquery',
      deps: [],
      packageName: 'jquery',
      shimed: false
    });
  }
  // very simple deps trace
  let deps = [];
  let transformed;
  if (shim) {
    if (shim.deps) deps = shim.deps;
    transformed = contents;
    transformed += `define('${moduleId}',${JSON.stringify(deps)},function(){`;
    if (shim.exports) {
      transformed += `return ${shim.exports};`;
    }
    transformed += '});';
  } else if (contents.startsWith('define')) {
    transformed = contents;
  } else {
    if (contents) deps = contents.split(' ');
    transformed = `define('${moduleId}',${JSON.stringify(deps)},1);`
  }

  return Promise.resolve({
    path: unit.path,
    contents: transformed,
    sourceMap: unit.sourceMap,
    moduleId,
    defined: moduleId,
    deps,
    packageName: unit.packageName,
    shimed: !!shim
  });
}

function mockContentOrFile(fakeReader) {
  return pathOrContent => contentOrFile(pathOrContent, {readFile: fakeReader});
}

function createBundler(fakeFs = {}, opts = {}) {
  const fakeReader = buildReadFile(fakeFs);
  opts.packageLocator = mockLocator(fakeReader);

  return new Bundler(opts, {
    trace: mockTrace,
    resolve: mockResolve,
    contentOrFile: mockContentOrFile(fakeReader)
  });
}

test('Bundler traces files', t => {
  const fakeFs = {
    'local/setup.js': 'setup',
    'local/after.js': 'after',
    'node_modules/dumber-module-loader/dist/index.js': 'dumber-module-loader',
    'node_modules/foo/package.json': JSON.stringify({name: 'foo', main: 'index'}),
    'node_modules/foo/index.js': 'loo',
    'node_modules/foo/bar.js': '',
    'node_modules/loo/package.json':  JSON.stringify({name: 'loo', main: './loo'}),
    'node_modules/loo/loo.js': '',
  };
  const bundler = createBundler(fakeFs, {
    prepends: ['var pre = 1;', '', undefined, false, 'local/setup.js', null],
    appends: ['local/after.js', 'var ape = 1;']
  });

  Promise.resolve()
  .then(() => bundler.capture({path: 'src/app.js', contents: 'foo page/one', moduleId: 'app'}))
  .then(() => bundler.capture({path: 'src/page/one.js', contents: 'foo/bar loo', moduleId: 'page/one'}))
  .then(() => bundler.resolve())
  .then(() => bundler.bundle())
  .then(
    bundleMap => {
      t.deepEqual(bundleMap, {
        'entry-bundle': {
          files: [
            {contents: 'var pre = 1;'},
            {contents: 'setup'},
            {contents: 'dumber-module-loader'},
            {contents: 'define.switchToUserSpace();'},
            {path: 'src/app.js', contents: "define('app',[\"foo\",\"page/one\"],1);", sourceMap: undefined},
            {path: 'src/page/one.js', contents: "define('page/one',[\"foo/bar\",\"loo\"],1);", sourceMap: undefined},
            {contents: 'define.switchToPackageSpace();'},
            {path: 'node_modules/foo/bar.js', contents: "define('foo/bar',[],1);", sourceMap: undefined},
            {path: 'node_modules/foo/index.js', contents: "define('foo/index',[\"loo\"],1);define('foo',['foo/index'],function(m){return m;});\n", sourceMap: undefined},
            {path: 'node_modules/loo/loo.js', contents: "define('loo/loo',[],1);define('loo',['loo/loo'],function(m){return m;});\n", sourceMap: undefined},
            {contents: 'define.switchToUserSpace();'},
            {contents: 'after'},
            {contents: 'var ape = 1;'},
          ],
          config: {
            baseUrl: 'dist',
            bundles: {}
          }
        }
      })
    },
    err => t.fail(err.stack)
  )
  .then(t.end);
});

test('Bundler traces files, split bundles', t => {
  const fakeFs = {
    'local/setup.js': 'setup',
    'local/after.js': 'after',
    'node_modules/dumber-module-loader/dist/index.js': 'dumber-module-loader',
    'node_modules/foo/package.json': JSON.stringify({name: 'foo', main: 'index'}),
    'node_modules/foo/index.js': 'loo',
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
  .then(() => bundler.capture({path: 'src/app.js', contents: 'foo page/one', moduleId: 'app'}))
  .then(() => bundler.capture({path: 'src/page/one.js', contents: 'foo/bar loo', moduleId: 'page/one'}))
  .then(() => bundler.resolve())
  .then(() => bundler.bundle())
  .then(
    bundleMap => {
      t.deepEqual(bundleMap, {
        'entry-bundle': {
          files: [
            {contents: 'var pre = 1;'},
            {contents: 'setup'},
            {contents: 'dumber-module-loader'},
            {contents: 'define.switchToUserSpace();'},
            {path: 'src/app.js', contents: "define('app',[\"foo\",\"page/one\"],1);", sourceMap: undefined},
            {path: 'src/page/one.js', contents: "define('page/one',[\"foo/bar\",\"loo\"],1);", sourceMap: undefined},
            {contents: 'after'},
            {contents: 'var ape = 1;'},
          ],
          config: {
            baseUrl: 'dist',
            bundles: {
              'vendor': {
                user: [],
                package: ['foo', 'foo/bar', 'foo/index', 'loo', 'loo/loo']
              }
            }
          }
        },
        'vendor': {
          files: [
            {contents: 'define.switchToPackageSpace();'},
            {path: 'node_modules/foo/bar.js', contents: "define('foo/bar',[],1);", sourceMap: undefined},
            {path: 'node_modules/foo/index.js', contents: "define('foo/index',[\"loo\"],1);define('foo',['foo/index'],function(m){return m;});\n", sourceMap: undefined},
            {path: 'node_modules/loo/loo.js', contents: "define('loo/loo',[],1);define('loo',['loo/loo'],function(m){return m;});\n", sourceMap: undefined},
            {contents: 'define.switchToUserSpace();'},
          ]
        }
      })
    },
    err => t.fail(err.stack)
  )
  .then(t.end);
});

test('Bundler traces files, split bundles, case2', t => {
  const fakeFs = {
    'local/setup.js': 'setup',
    'local/after.js': 'after',
    'node_modules/dumber-module-loader/dist/index.js': 'dumber-module-loader',
    'node_modules/foo/package.json': JSON.stringify({name: 'foo', main: 'index'}),
    'node_modules/foo/index.js': 'loo',
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
  .then(() => bundler.capture({path: 'src/app.js', contents: 'foo page/one', moduleId: 'app'}))
  .then(() => bundler.capture({path: 'src/page/one.js', contents: 'foo/bar loo', moduleId: 'page/one'}))
  .then(() => bundler.resolve())
  .then(() => bundler.bundle())
  .then(
    bundleMap => {
      t.deepEqual(bundleMap, {
        'main': {
          files: [
            {contents: 'var pre = 1;'},
            {contents: 'setup'},
            {contents: 'dumber-module-loader'},
            {contents: 'after'},
            {contents: 'var ape = 1;'},
          ],
          config: {
            baseUrl: 'scripts',
            bundles: {
              'vendor': {
                user: [],
                package: ['foo', 'foo/bar', 'foo/index']
              },
              'app': {
                user: ['app', 'page/one'],
                package: ['loo', 'loo/loo']
              }
            }
          }
        },
        'app': {
          files: [
            {contents: 'define.switchToUserSpace();'},
            {path: 'src/app.js', contents: "define('app',[\"foo\",\"page/one\"],1);", sourceMap: undefined},
            {path: 'src/page/one.js', contents: "define('page/one',[\"foo/bar\",\"loo\"],1);", sourceMap: undefined},
            {contents: 'define.switchToPackageSpace();'},
            {path: 'node_modules/loo/loo.js', contents: "define('loo/loo',[],1);define('loo',['loo/loo'],function(m){return m;});\n", sourceMap: undefined},
            {contents: 'define.switchToUserSpace();'},
          ]
        },
        'vendor': {
          files: [
            {contents: 'define.switchToPackageSpace();'},
            {path: 'node_modules/foo/bar.js', contents: "define('foo/bar',[],1);", sourceMap: undefined},
            {path: 'node_modules/foo/index.js', contents: "define('foo/index',[\"loo\"],1);define('foo',['foo/index'],function(m){return m;});\n", sourceMap: undefined},
            {contents: 'define.switchToUserSpace();'},
          ]
        }
      })
    },
    err => t.fail(err.stack)
  )
  .then(t.end);
});

test('Bundler traces files, sorts shim', t => {
  const fakeFs = {
    'node_modules/dumber-module-loader/dist/index.js': 'dumber-module-loader',
    'node_modules/jquery/package.json': JSON.stringify({name: 'jquery', main: 'dist/jquery'}),
    'node_modules/jquery/dist/jquery.js': 'define("jquery",[],1);',
    'node_modules/bootstrap/package.json':  JSON.stringify({name: 'bootstrap', main: './dist/bootstrap'}),
    'node_modules/bootstrap/dist/bootstrap.js': '',
  };
  const bundler = createBundler(fakeFs, {
    deps: [
      {name: 'bootstrap', deps: ['jquery'], 'exports': 'jQuery'}
    ]
  });

  Promise.resolve()
  .then(() => bundler.capture({path: 'src/app.js', contents: 'fs bootstrap', moduleId: 'app'}))
  .then(() => bundler.resolve())
  .then(() => bundler.bundle())
  .then(
    bundleMap => {
      t.deepEqual(bundleMap, {
        'entry-bundle': {
          files: [
            {contents: 'dumber-module-loader'},
            {contents: 'define.switchToUserSpace();'},
            {path: 'src/app.js', contents: "define('app',[\"fs\",\"bootstrap\"],1);", sourceMap: undefined},
            {contents: 'define.switchToPackageSpace();'},
            {path: 'node_modules/jquery/dist/jquery.js', contents: 'define("jquery",[],1);', sourceMap: undefined},
            {path: 'node_modules/bootstrap/dist/bootstrap.js', contents: "define('bootstrap/dist/bootstrap',[\"jquery\"],function(){return jQuery;});define('bootstrap',['bootstrap/dist/bootstrap'],function(m){return m;});\n", sourceMap: undefined},
            // mockTrace didn't touch fs stub, it is different in real usage
            {path: '__stub__/fs', contents: "define(function(){return {};});", sourceMap: undefined},
            {contents: 'define.switchToUserSpace();'},
          ],
          config: {
            baseUrl: 'dist',
            bundles: {}
          }
        }
      })
    },
    err => t.fail(err.stack)
  )
  .then(t.end);
});

test('Bundler ignores module when onRequire returns false', t => {
  const fakeFs = {
    'node_modules/dumber-module-loader/dist/index.js': 'dumber-module-loader',
  };
  const bundler = createBundler(fakeFs, {
    onRequire(moduleId) {
      if (moduleId === 'foo') return false;
    }
  });

  Promise.resolve()
  .then(() => bundler.capture({path: 'src/app.js', contents: 'foo', moduleId: 'app'}))
  .then(() => bundler.resolve())
  .then(() => bundler.bundle())
  .then(
    bundleMap => {
      t.deepEqual(bundleMap, {
        'entry-bundle': {
          files: [
            {contents: 'dumber-module-loader'},
            {contents: 'define.switchToUserSpace();'},
            {path: 'src/app.js', contents: "define('app',[\"foo\"],1);", sourceMap: undefined},
          ],
          config: {
            baseUrl: 'dist',
            bundles: {}
          }
        }
      })
    },
    err => t.fail(err.stack)
  )
  .then(t.end);
});

test('Bundler replaces deps when onRequire returns array', t => {
  const fakeFs = {
    'node_modules/dumber-module-loader/dist/index.js': 'dumber-module-loader',
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
  .then(() => bundler.capture({path: 'src/app.js', contents: 'foo', moduleId: 'app'}))
  .then(() => bundler.resolve())
  .then(() => bundler.bundle())
  .then(
    bundleMap => {
      t.deepEqual(bundleMap, {
        'entry-bundle': {
          files: [
            {contents: 'dumber-module-loader'},
            {contents: 'define.switchToUserSpace();'},
            {path: 'src/app.js', contents: "define('app',[\"foo\"],1);", sourceMap: undefined},
            {contents: 'define.switchToPackageSpace();'},
            {path: 'node_modules/bar/index.js', contents: "define('bar/index',[],1);define('bar',['bar/index'],function(m){return m;});\n", sourceMap: undefined},
            {path: 'node_modules/loo/loo.js', contents: "define('loo/loo',[],1);define('loo',['loo/loo'],function(m){return m;});\n", sourceMap: undefined},
            {contents: 'define.switchToUserSpace();'},
          ],
          config: {
            baseUrl: 'dist',
            bundles: {}
          }
        }
      })
    },
    err => t.fail(err.stack)
  )
  .then(t.end);
});

test('Bundler supports implementation returned by onRequire', t => {
  const fakeFs = {
    'node_modules/dumber-module-loader/dist/index.js': 'dumber-module-loader',
    'node_modules/loo/package.json': '{"name":"loo","main":"loo"}',
    'node_modules/loo/loo.js': '',
  };
  const bundler = createBundler(fakeFs, {
    onRequire(moduleId) {
      // onRequire can return a Promise to resolve to false, array, or string.
      if (moduleId === 'foo') return Promise.resolve("loo"); // "loo" will be processed by mockTrace
    }
  });

  Promise.resolve()
  .then(() => bundler.capture({path: 'src/app.js', contents: 'foo', moduleId: 'app'}))
  .then(() => bundler.resolve())
  .then(() => bundler.bundle())
  .then(
    bundleMap => {
      t.deepEqual(bundleMap, {
        'entry-bundle': {
          files: [
            {contents: 'dumber-module-loader'},
            {contents: 'define.switchToUserSpace();'},
            {path: 'src/app.js', contents: "define('app',[\"foo\"],1);", sourceMap: undefined},
            {path: '__on_require__/foo', contents: "define('foo',[\"loo\"],1);", sourceMap: undefined},
            {contents: 'define.switchToPackageSpace();'},
            {path: 'node_modules/loo/loo.js', contents: "define('loo/loo',[],1);define('loo',['loo/loo'],function(m){return m;});\n", sourceMap: undefined},
            {contents: 'define.switchToUserSpace();'},
          ],
          config: {
            baseUrl: 'dist',
            bundles: {}
          }
        }
      })
    },
    err => t.fail(err.stack)
  )
  .then(t.end);
});

test('Bundler swallows onRequire exception', t => {
  const fakeFs = {
    'node_modules/dumber-module-loader/dist/index.js': 'dumber-module-loader',
    'node_modules/foo/package.json': '{"name":"foo","main":"foo"}',
    'node_modules/foo/foo.js': '',
  };
  const bundler = createBundler(fakeFs, {
    onRequire(moduleId) {
      if (moduleId === 'foo') throw new Error("haha");
    }
  });

  Promise.resolve()
  .then(() => bundler.capture({path: 'src/app.js', contents: 'foo', moduleId: 'app'}))
  .then(() => bundler.resolve())
  .then(() => bundler.bundle())
  .then(
    bundleMap => {
      t.deepEqual(bundleMap, {
        'entry-bundle': {
          files: [
            {contents: 'dumber-module-loader'},
            {contents: 'define.switchToUserSpace();'},
            {path: 'src/app.js', contents: "define('app',[\"foo\"],1);", sourceMap: undefined},
            {contents: 'define.switchToPackageSpace();'},
            {path: 'node_modules/foo/foo.js', contents: "define('foo/foo',[],1);define('foo',['foo/foo'],function(m){return m;});\n", sourceMap: undefined},
            {contents: 'define.switchToUserSpace();'},
          ],
          config: {
            baseUrl: 'dist',
            bundles: {}
          }
        }
      })
    },
    err => t.fail(err.stack)
  )
  .then(t.end);
});

test('Bundler swallows onRequire promise rejection', t => {
  const fakeFs = {
    'node_modules/dumber-module-loader/dist/index.js': 'dumber-module-loader',
    'node_modules/foo/package.json': '{"name":"foo","main":"foo"}',
    'node_modules/foo/foo.js': '',
  };
  const bundler = createBundler(fakeFs, {
    onRequire(moduleId) {
      if (moduleId === 'foo') return Promise.reject(new Error("haha"));
    }
  });

  Promise.resolve()
  .then(() => bundler.capture({path: 'src/app.js', contents: 'foo', moduleId: 'app'}))
  .then(() => bundler.resolve())
  .then(() => bundler.bundle())
  .then(
    bundleMap => {
      t.deepEqual(bundleMap, {
        'entry-bundle': {
          files: [
            {contents: 'dumber-module-loader'},
            {contents: 'define.switchToUserSpace();'},
            {path: 'src/app.js', contents: "define('app',[\"foo\"],1);", sourceMap: undefined},
            {contents: 'define.switchToPackageSpace();'},
            {path: 'node_modules/foo/foo.js', contents: "define('foo/foo',[],1);define('foo',['foo/foo'],function(m){return m;});\n", sourceMap: undefined},
            {contents: 'define.switchToUserSpace();'},
          ],
          config: {
            baseUrl: 'dist',
            bundles: {}
          }
        }
      })
    },
    err => t.fail(err.stack)
  )
  .then(t.end);
});

test('Bundler uses cache by default', t => {
  const bundler = createBundler();
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
    'node_modules/dumber-module-loader/dist/index.js': 'dumber-module-loader',
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
  .then(() => bundler.capture({path: 'src/app.js', contents: 'foo page/one', moduleId: 'app'}))
  .then(() => bundler.capture({path: 'src/page/one.js', contents: '', moduleId: 'page/one'}))
  .then(() => bundler.resolve())
  .then(() => bundler.bundle())
  .then(
    bundleMap => {
      t.deepEqual(bundleMap, {
        'entry-bundle': {
          files: [
            {contents: 'dumber-module-loader'}
          ],
          config: {
            baseUrl: 'dist',
            bundles: {
              'vendor-bundle': {
                user: [],
                package: ['foo', 'foo/index']
              },
              'app-bundle': {
                user: ['app'],
                package: []
              },
              'page-bundle': {
                user: ['page/one'],
                package: []
              }
            }
          }
        },
        'app-bundle': {
          files: [
            {contents: 'define.switchToUserSpace();'},
            {path: 'src/app.js', contents: "define('app',[\"foo\",\"page/one\"],1);", sourceMap: undefined},
          ]
        },
        'page-bundle': {
          files: [
            {contents: 'define.switchToUserSpace();'},
            {path: 'src/page/one.js', contents: "define('page/one',[],1);", sourceMap: undefined},
          ]
        },
        'vendor-bundle': {
          files: [
            {contents: 'define.switchToPackageSpace();'},
            {path: 'node_modules/foo/index.js', contents: "define('foo/index',[],1);define('foo',['foo/index'],function(m){return m;});\n", sourceMap: undefined},
            {contents: 'define.switchToUserSpace();'}
          ]
        }
      })
    },
    err => t.fail(err.stack)
  )
  .then(() => bundler.capture({path: 'src/page/one.js', contents: 'foo/bar loo', moduleId: 'page/one'}))
  .then(() => bundler.resolve())
  .then(() => bundler.bundle())
  .then(
    bundleMap => {
      t.deepEqual(bundleMap, {
        'entry-bundle': {
          files: [
            {contents: 'dumber-module-loader'},
            {contents: 'define.switchToPackageSpace();'},
            {path: 'node_modules/loo/loo.js', contents: "define('loo/loo',[],1);define('loo',['loo/loo'],function(m){return m;});\n", sourceMap: undefined},
            {contents: 'define.switchToUserSpace();'}
          ],
          config: {
            baseUrl: 'dist',
            bundles: {
              'vendor-bundle': {
                user: [],
                package: ['foo', 'foo/bar', 'foo/index']
              },
              'app-bundle': {
                user: ['app'],
                package: []
              },
              'page-bundle': {
                user: ['page/one'],
                package: []
              }
            }
          }
        },
        'page-bundle': {
          files: [
            {contents: 'define.switchToUserSpace();'},
            {path: 'src/page/one.js', contents: "define('page/one',[\"foo/bar\",\"loo\"],1);", sourceMap: undefined},
          ]
        },
        'vendor-bundle': {
          files: [
            {contents: 'define.switchToPackageSpace();'},
            {path: 'node_modules/foo/bar.js', contents: "define('foo/bar',[],1);", sourceMap: undefined},
            {path: 'node_modules/foo/index.js', contents: "define('foo/index',[],1);define('foo',['foo/index'],function(m){return m;});\n", sourceMap: undefined},
            {contents: 'define.switchToUserSpace();'}
          ]
        }
      })
    },
    err => t.fail(err.stack)
  )
  .then(() => bundler.capture({path: 'src/goo.js', contents: '', moduleId: 'goo'}))
  .then(() => bundler.capture({path: 'src/goo2.js', contents: '', moduleId: 'goo2'}))
  .then(() => bundler.resolve())
  .then(() => bundler.bundle())
  .then(
    bundleMap => {
      t.deepEqual(bundleMap, {
        'entry-bundle': {
          files: [
            {contents: 'dumber-module-loader'},
            {contents: 'define.switchToPackageSpace();'},
            {path: 'node_modules/loo/loo.js', contents: "define('loo/loo',[],1);define('loo',['loo/loo'],function(m){return m;});\n", sourceMap: undefined},
            {contents: 'define.switchToUserSpace();'}
          ],
          config: {
            baseUrl: 'dist',
            bundles: {
              'vendor-bundle': {
                user: [],
                package: ['foo', 'foo/bar', 'foo/index']
              },
              'app-bundle': {
                user: ['app', 'goo', 'goo2'],
                package: []
              },
              'page-bundle': {
                user: ['page/one'],
                package: []
              }
            }
          }
        },
        'app-bundle': {
          files: [
            {contents: 'define.switchToUserSpace();'},
            {path: 'src/app.js', contents: "define('app',[\"foo\",\"page/one\"],1);", sourceMap: undefined},
            {path: 'src/goo.js', contents: "define('goo',[],1);", sourceMap: undefined},
            {path: 'src/goo2.js', contents: "define('goo2',[],1);", sourceMap: undefined},
          ]
        },
      })
    },
    err => t.fail(err.stack)
  )
  .then(t.end);
});
