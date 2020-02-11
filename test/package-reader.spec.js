const test = require('tape');
const PackageReader = require('../lib/package-reader');
const Package = require('../lib/package');
const {mockPackageFileReader, buildReadFile} = require('./mock');

function getReader(name, fakeFs) {
  const fakeReader = buildReadFile(fakeFs);
  return mockPackageFileReader(fakeReader)(new Package(name)).then(fileReader => new PackageReader(fileReader));
}

test('packageReader falls back to main:index when package.json is missing', t => {
  getReader('foo', {
    'node_modules/foo/index.js': "lorem"
  }).then(r => {
    r.readMain().then(
      unit => {
        t.equal(r.version, 'N/A');
        t.deepEqual(unit, {
          path: 'node_modules/foo/index.js',
          contents: 'lorem',
          moduleId: 'foo/index',
          alias: 'foo',
          packageName: 'foo',
          packageMainPath: 'index.js',
          sourceMap: undefined
        });

        t.equal(r.name, 'foo');
        t.equal(r.mainPath, 'index.js');
        t.deepEqual(r.browserReplacement, {});
      },
      err => {
        t.fail(err.message);
      }
    ).then(t.end);
  });
});

test('packageReader rejects missing main', t => {
  getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "index", "version": "1.0.0"}'
  }).then(r => {
    r.readMain().then(
      () => {
        t.fail('should not pass');
      },
      () => {
        t.equal(r.version, '1.0.0');
        t.pass('it throws');
      }
    ).then(t.end);
  });
});

test('packageReader can still read resource when main is missing', t => {
  getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "index", "version": "1.0.0"}',
    'node_modules/foo/bar.js': 'lorem'
  }).then(r => {
    r.readResource('bar').then(
      unit => {
        t.equal(r.version, '1.0.0');
        t.deepEqual(unit, {
          path: 'node_modules/foo/bar.js',
          contents: 'lorem',
          moduleId: 'foo/bar',
          packageName: 'foo',
          packageMainPath: 'index.js',
          sourceMap: undefined
        });

        t.equal(r.name, 'foo');
        t.equal(r.mainPath, 'index.js');
        t.deepEqual(r.browserReplacement, {});
      },
      err => {
        t.fail(err.message);
      },
    ).then(t.end);
  });
});

test('packageReader uses default index.js as main path if main file is missing but not required', t => {
  getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "foo", "version": "1.0.0"}',
    'node_modules/foo/bar.js': 'lorem'
  }).then(r => {
    r.readResource('bar').then(
      unit => {
        t.equal(r.version, '1.0.0');
        t.deepEqual(unit, {
          path: 'node_modules/foo/bar.js',
          contents: 'lorem',
          moduleId: 'foo/bar',
          packageName: 'foo',
          packageMainPath: 'index.js',
          sourceMap: undefined
        });

        t.equal(r.name, 'foo');
        t.equal(r.mainPath, 'index.js');
        t.deepEqual(r.browserReplacement, {});
      },
      err => {
        t.fail(err.message);
      },
    ).then(t.end);
  });
});

test('packageReader reads main file', t => {
  getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "index"}',
    'node_modules/foo/index.js': "lorem"
  }).then(r => {
    r.readMain().then(
      unit => {
        t.equal(r.version, 'N/A');
        t.deepEqual(unit, {
          path: 'node_modules/foo/index.js',
          contents: 'lorem',
          moduleId: 'foo/index',
          packageName: 'foo',
          packageMainPath: 'index.js',
          alias: 'foo',
          sourceMap: undefined
        });

        t.equal(r.name, 'foo');
        t.equal(r.mainPath, 'index.js');
        t.deepEqual(r.browserReplacement, {});
      },
      err => {
        t.fail(err.message);
      }
    ).then(t.end);
  });
});

test('packageReader reads resource file which is actually main', t => {
  getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "index"}',
    'node_modules/foo/index.js': "lorem"
  }).then(r => {
    r.readResource('index').then(
      unit => {
        t.equal(r.version, 'N/A');
        t.deepEqual(unit, {
          path: 'node_modules/foo/index.js',
          contents: 'lorem',
          moduleId: 'foo/index',
          packageName: 'foo',
          packageMainPath: 'index.js',
          alias: 'foo',
          sourceMap: undefined
        });

        t.equal(r.name, 'foo');
        t.equal(r.mainPath, 'index.js');
        t.deepEqual(r.browserReplacement, {});
      },
      err => {
        t.fail(err.message);
      }
    ).then(t.end);
  });
});

test('packageReader tolerate invalid package.json', t => {
  getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "index"',
    'node_modules/foo/index.js': "lorem"
  }).then(r => {
    r.readResource('index').then(
      unit => {
        t.equal(r.version, 'N/A');
        t.deepEqual(unit, {
          path: 'node_modules/foo/index.js',
          contents: 'lorem',
          moduleId: 'foo/index',
          packageName: 'foo',
          packageMainPath: 'index.js',
          alias: 'foo',
          sourceMap: undefined
        });

        t.equal(r.name, 'foo');
        t.equal(r.mainPath, 'index.js');
        t.deepEqual(r.browserReplacement, {});
      },
      err => {
        t.fail(err.message);
      }
    ).then(t.end);
  });
});

test('packageReader use default main index.js', t => {
  getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo"}',
    'node_modules/foo/index.js': "lorem"
  }).then(r => {
    r.readMain().then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/index.js',
          contents: 'lorem',
          moduleId: 'foo/index',
          packageName: 'foo',
          packageMainPath: 'index.js',
          alias: 'foo',
          sourceMap: undefined
        });

        t.equal(r.name, 'foo');
        t.equal(r.mainPath, 'index.js');
        t.deepEqual(r.browserReplacement, {});
      },
      err => {
        t.fail(err.message);
      }
    ).then(t.end);
  });
});

test('packageReader reads module over main field', t => {
  getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "module": "es", "main": "index"}',
    'node_modules/foo/index.js': "lorem",
    'node_modules/foo/es.js': 'es',
  }).then(r => {
    r.readMain().then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/es.js',
          contents: 'es',
          moduleId: 'foo/es',
          packageName: 'foo',
          packageMainPath: 'es.js',
          alias: 'foo',
          sourceMap: undefined
        });

        t.equal(r.name, 'foo');
        t.equal(r.mainPath, 'es.js');
        t.deepEqual(r.browserReplacement, {});
      },
      err => {
        t.fail(err.message);
      }
    ).then(t.end);
  });
});

test('packageReader reads browser over module/main field', t => {
  getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "browser": "br", "module": "es", "main": "index"}',
    'node_modules/foo/index.js': "lorem",
    'node_modules/foo/es.js': 'es',
    'node_modules/foo/br.js': 'br'
  }).then(r => {
    r.readMain().then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/br.js',
          contents: 'br',
          moduleId: 'foo/br',
          packageName: 'foo',
          packageMainPath: 'br.js',
          alias: 'foo',
          sourceMap: undefined
        });

        t.equal(r.name, 'foo');
        t.equal(r.mainPath, 'br.js');
        t.deepEqual(r.browserReplacement, {});
      },
      err => {
        t.fail(err.message);
      }
    ).then(t.end);
  });
});

test('packageReader reads dumberForcedMain over browser/module/main field', t => {
  getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "browser": "br", "module": "es", "main": "index", "dumberForcedMain": "hc"}',
    'node_modules/foo/index.js': "lorem",
    'node_modules/foo/es.js': 'es',
    'node_modules/foo/br.js': 'br',
    'node_modules/foo/hc.js': 'hc',
  }).then(r => {
    r.readMain().then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/hc.js',
          contents: 'hc',
          moduleId: 'foo/hc',
          packageName: 'foo',
          packageMainPath: 'hc.js',
          alias: 'foo',
          sourceMap: undefined
        });

        t.equal(r.name, 'foo');
        t.equal(r.mainPath, 'hc.js');
        t.deepEqual(r.browserReplacement, {});
      },
      err => {
        t.fail(err.message);
      }
    ).then(t.end);
  });
});

test('packageReader reads main file with explicit ext', t => {
  getReader('foo.js', {
    'node_modules/foo.js/package.json': '{"name":"foo.js", "main": "./main.js"}',
    'node_modules/foo.js/main.js': "lorem"
  }).then(r => {
    r.readMain().then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo.js/main.js',
          contents: 'lorem',
          moduleId: 'foo.js/main',
          packageName: 'foo.js',
          packageMainPath: 'main.js',
          alias: 'foo.js',
          sourceMap: undefined
        });

        t.equal(r.name, 'foo.js');
        t.equal(r.mainPath, 'main.js');
        t.deepEqual(r.browserReplacement, {});
      },
      err => {
        t.fail(err.message);
      }
    ).then(t.end);
  });
});

test('packageReader reads main file with non-js file', t => {
  getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "./main.css"}',
    'node_modules/foo/main.css': "lorem"
  }).then(r => {
    r.readMain().then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/main.css',
          contents: 'lorem',
          moduleId: 'foo/main.css',
          packageName: 'foo',
          packageMainPath: 'main.css',
          sourceMap: undefined
        });

        t.equal(r.name, 'foo');
        t.equal(r.mainPath, 'main.css');
        t.deepEqual(r.browserReplacement, {});
      },
      err => {
        t.fail(err.message);
      }
    ).then(t.end);
  });
});

test('packageReader reads implicit main file', t => {
  getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "./lib"}',
    'node_modules/foo/lib/index.js': "lorem"
  }).then(r => {
    return r.readMain().then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/lib/index.js',
          contents: 'lorem',
          moduleId: 'foo/lib/index',
          packageName: 'foo',
          packageMainPath: 'lib/index.js',
          alias: 'foo',
          sourceMap: undefined
        });

        t.equal(r.name, 'foo');
        t.equal(r.mainPath, 'lib/index.js');
        t.deepEqual(r.browserReplacement, {});
      },
      err => t.fail(err.message)
    );
  }).then(t.end);
});

test('packageReader rejects missing resource', t => {
  getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "lib/main"}',
    'node_modules/foo/lib/main.js': 'lorem',
    'node_modules/foo/lib/bar.js': 'lorem2'
  }).then(r => {
    r.readResource('dist/bar').then(
      err => {
        t.fail(err.message);
      },
      () => {
        t.pass('it throws');
      }
    ).then(t.end);
  });
});

test('packageReader reads resource', t => {
  getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "lib/main"}',
    'node_modules/foo/lib/main.js': 'lorem',
    'node_modules/foo/lib/bar.js': 'lorem2'
  }).then(r => {
    r.readResource('lib/bar').then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/lib/bar.js',
          contents: 'lorem2',
          moduleId: 'foo/lib/bar',
          packageName: 'foo',
          packageMainPath: 'lib/main.js',
          sourceMap: undefined
        });

        t.equal(r.name, 'foo');
        t.equal(r.mainPath, 'lib/main.js');
        t.deepEqual(r.browserReplacement, {});
      },
      err => {
        t.fail(err.message);
      }
    ).then(t.end);
  });
});

test('packageReader reads relative resource', t => {
  getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "lib/main"}',
    'node_modules/foo/lib/main.js': 'lorem',
    'node_modules/foo/lib/bar.js': 'lorem2'
  }).then(r => {
    r.readResource('bar').then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/lib/bar.js',
          contents: 'lorem2',
          moduleId: 'foo/lib/bar',
          packageName: 'foo',
          packageMainPath: 'lib/main.js',
          alias: 'foo/bar',
          sourceMap: undefined
        });

        t.equal(r.name, 'foo');
        t.equal(r.mainPath, 'lib/main.js');
        t.deepEqual(r.browserReplacement, {});
      },
      err => {
        t.fail(err.message);
      }
    ).then(t.end);
  });
});

test('packageReader reads deep relative resource', t => {
  getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "dist/cjs/main"}',
    'node_modules/foo/dist/cjs/main.js': 'lorem',
    'node_modules/foo/dist/cjs/foo/bar.js': 'lorem2'
  }).then(r => {
    r.readResource('foo/bar').then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/dist/cjs/foo/bar.js',
          contents: 'lorem2',
          moduleId: 'foo/dist/cjs/foo/bar',
          packageName: 'foo',
          packageMainPath: 'dist/cjs/main.js',
          alias: 'foo/foo/bar',
          sourceMap: undefined
        });

        t.equal(r.name, 'foo');
        t.equal(r.mainPath, 'dist/cjs/main.js');
        t.deepEqual(r.browserReplacement, {});
      },
      err => {
        t.fail(err.message);
      }
    ).then(t.end);
  });
});

test('packageReader reads deep relative resource which is actually main', t => {
  getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "dist/cjs/main"}',
    'node_modules/foo/dist/cjs/main.js': 'lorem',
  }).then(r => {
    r.readResource('main').then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/dist/cjs/main.js',
          contents: 'lorem',
          moduleId: 'foo/dist/cjs/main',
          packageName: 'foo',
          packageMainPath: 'dist/cjs/main.js',
          alias: ['foo', 'foo/main'],
          sourceMap: undefined
        });

        t.equal(r.name, 'foo');
        t.equal(r.mainPath, 'dist/cjs/main.js');
        t.deepEqual(r.browserReplacement, {});
      },
      err => {
        t.fail(err.message);
      }
    ).then(t.end);
  });
});

test('packageReader reads json resouce', t => {
  getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "dist/cjs/main"}',
    'node_modules/foo/dist/cjs/main.js': 'lorem',
    'node_modules/foo/dist/cjs/foo/bar.json': '{"a":1}'
  }).then(r => {
    r.readResource('foo/bar').then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/dist/cjs/foo/bar.json',
          contents: '{"a":1}',
          moduleId: 'foo/dist/cjs/foo/bar.json',
          packageName: 'foo',
          packageMainPath: 'dist/cjs/main.js',
          alias: 'foo/foo/bar',
          sourceMap: undefined
        });

        t.equal(r.name, 'foo');
        t.equal(r.mainPath, 'dist/cjs/main.js');
        t.deepEqual(r.browserReplacement, {});
      },
      err => {
        t.fail(err.message);
      }
    ).then(t.end);
  });
});

test('packageReader reads directory index.js', t => {
  getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "index"}',
    'node_modules/foo/index.js': 'lorem',
    'node_modules/foo/lib/index.js': 'lorem2'
  }).then(r => {
    r.readResource('lib').then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/lib/index.js',
          contents: 'lorem2',
          moduleId: 'foo/lib/index',
          packageName: 'foo',
          packageMainPath: 'index.js',
          alias: 'foo/lib',
          sourceMap: undefined
        });

        t.equal(r.name, 'foo');
        t.equal(r.mainPath, 'index.js');
        t.deepEqual(r.browserReplacement, {});
      },
      err => {
        t.fail(err.message);
      }
    ).then(t.end);
  });
});

test('packageReader reads directory index.json', t => {
  getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "index"}',
    'node_modules/foo/index.js': 'lorem',
    'node_modules/foo/lib/index.json': '{"a":1}'
  }).then(r => {
    r.readResource('lib').then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/lib/index.json',
          contents: '{"a":1}',
          moduleId: 'foo/lib/index.json',
          packageName: 'foo',
          packageMainPath: 'index.js',
          alias: 'foo/lib',
          sourceMap: undefined
        });

        t.equal(r.name, 'foo');
        t.equal(r.mainPath, 'index.js');
        t.deepEqual(r.browserReplacement, {});
      },
      err => {
        t.fail(err.message);
      }
    ).then(t.end);
  });
});

test('packageReader reads directory package.json', t => {
  getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "index"}',
    'node_modules/foo/index.js': 'lorem',
    'node_modules/foo/lib/package.json': '{"module":"es", "main":"index.js"}',
    'node_modules/foo/lib/es/index.js': 'es',
    'node_modules/foo/lib/index.js': 'index'
  }).then(r => {
    r.readResource('lib').then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/lib/es/index.js',
          contents: 'es',
          moduleId: 'foo/lib/es/index',
          packageName: 'foo',
          packageMainPath: 'index.js',
          alias: 'foo/lib',
          sourceMap: undefined
        });

        t.equal(r.name, 'foo');
        t.equal(r.mainPath, 'index.js');
        t.deepEqual(r.browserReplacement, {});
      },
      err => {
        t.fail(err.message);
      }
    ).then(t.end);
  });
});

test('packageReader complains broken directory package.json', t => {
  getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "index"}',
    'node_modules/foo/index.js': 'lorem',
    'node_modules/foo/lib/package.json': 'broken',
    'node_modules/foo/lib/es/index.js': 'es',
    'node_modules/foo/lib/index.js': 'index'
  }).then(r => {
    r.readResource('lib').then(
      () => {
        t.fail('should not load');
      },
      err => {
        t.pass(err.message);
      }
    ).then(t.end);
  });
});

test('packageReader reads browser replacement in package.json', t => {
  getReader('foo', {
    'node_modules/foo/package.json': `{
      "name": "foo",
      "main": "index",
      "browser": {
        "module-a": false,
        "module-b.js": "./shims/module/b.js",
        "./server/only.js": "./shims/client-only.js"
      }
    }`,
    'node_modules/foo/index.js': 'lorem'
  }).then(r => {
    r.readMain().then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/index.js',
          contents: 'lorem',
          moduleId: 'foo/index',
          packageName: 'foo',
          packageMainPath: 'index.js',
          alias: 'foo',
          replacement: {
            'module-a': '__ignore__',
            'module-b.js': './shims/module/b',
            './server/only': './shims/client-only'
          },
          sourceMap: undefined
        });

        t.equal(r.name, 'foo');
        t.equal(r.mainPath, 'index.js');
        t.deepEqual(r.browserReplacement, {
          'module-a': false,
          'module-b.js': './shims/module/b',
          './server/only': './shims/client-only'
        });
      },
      err => {
        t.fail(err.message);
      }
    ).then(t.end);
  });
});

test('packageReader uses browser replacement in package.json to normalize replacement', t => {
  getReader('foo', {
    'node_modules/foo/package.json': `{
      "name": "foo",
      "main": "index",
      "browser": {
        "module-a": false,
        "module-b.js": "./shims/module/b.js",
        "./server/only.js": "./shims/client-only.js"
      }
    }`,
    'node_modules/foo/shims/client-only.js': "require('module-a');require('module-b.js');require('module-c');"
  }).then(r => {
    r.readResource('server/only').then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/shims/client-only.js',
          contents: "require('module-a');require('module-b.js');require('module-c');",
          moduleId: 'foo/shims/client-only',
          packageName: 'foo',
          packageMainPath: 'index.js',
          replacement: {
            'module-a': '__ignore__',
            'module-b.js': './module/b',
            '../server/only': './client-only'
          },
          alias: 'foo/server/only',
          sourceMap: undefined
        });

        t.equal(r.name, 'foo');
        t.equal(r.mainPath, 'index.js');
      },
      err => {
        t.fail(err.message);
      }
    ).then(t.end);
  });
});

test('packageReader uses browser replacement in package.json to normalize main read', t => {
  getReader('foo', {
    'node_modules/foo/package.json': `{
      "name": "foo",
      "main": "index",
      "browser": {
        "./index.js": "./browser.js"
      }
    }`,
    'node_modules/foo/index.js': "index",
    'node_modules/foo/browser.js': "browser"
  }).then(r => {
    r.readMain().then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/browser.js',
          contents: "browser",
          moduleId: 'foo/browser',
          packageName: 'foo',
          packageMainPath: 'browser.js',
          alias: 'foo',
          replacement: { './index': './browser' },
          sourceMap: undefined
        });

        t.equal(r.name, 'foo');
        t.equal(r.mainPath, 'browser.js');
      },
      err => {
        t.fail(err.message);
      }
    ).then(t.end);
  });
});

test('packageReader uses browser replacement in package.json to normalize resource read which is actually main', t => {
  getReader('foo', {
    'node_modules/foo/package.json': `{
      "name": "foo",
      "main": "index",
      "browser": {
        "./index.js": "./browser.js"
      }
    }`,
    'node_modules/foo/index.js': "index",
    'node_modules/foo/browser.js': "browser"
  }).then(r => {
    r.readResource('browser').then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/browser.js',
          contents: "browser",
          moduleId: 'foo/browser',
          packageName: 'foo',
          packageMainPath: 'browser.js',
          alias: 'foo',
          replacement: { './index': './browser' },
          sourceMap: undefined
        });

        t.equal(r.name, 'foo');
        t.equal(r.mainPath, 'browser.js');
      },
      err => {
        t.fail(err.message);
      }
    ).then(t.end);
  });
});

test('packageReader uses browser replacement in package.json to normalize main replacement', t => {
  getReader('foo', {
    'node_modules/foo/package.json': `{
      "name": "foo",
      "main": "index",
      "browser": {
        "module-a": false,
        "module-b.js": "./shims/module/b.js",
        "./server/only.js": "./shims/client-only.js"
      }
    }`,
    'node_modules/foo/index.js': "require('module-a');require('module-b.js');require('module-c');require('./server/only.js');"
  }).then(r => {
    r.readMain().then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/index.js',
          contents: "require('module-a');require('module-b.js');require('module-c');require('./server/only.js');",
          moduleId: 'foo/index',
          packageName: 'foo',
          packageMainPath: 'index.js',
          alias: 'foo',
          replacement: {
            'module-a': '__ignore__',
            'module-b.js': './shims/module/b',
            './server/only': './shims/client-only'
          },
          sourceMap: undefined
        });

        t.equal(r.name, 'foo');
        t.equal(r.mainPath, 'index.js');
      },
      err => {
        t.fail(err.message);
      }
    ).then(t.end);
  });
});

test('packageReader uses browser replacement in package.json to normalize replacement in sub-folder', t => {
  getReader('foo', {
    'node_modules/foo/package.json': `{
      "name": "foo",
      "main": "index",
      "browser": {
        "module-a": false,
        "module-b.js": "./shims/module/b.js",
        "./server/only.js": "./shims/client-only.js"
      }
    }`,
    'node_modules/foo/index.js': 'lorem',
    'node_modules/foo/server/bar.js': "require('module-a');require('module-b.js');require('module-c');require('./only.js');"
  }).then(r => {
    r.readResource('server/bar').then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/server/bar.js',
          contents: "require('module-a');require('module-b.js');require('module-c');require('./only.js');",
          moduleId: 'foo/server/bar',
          packageName: 'foo',
          packageMainPath: 'index.js',
          replacement: {
            'module-a': '__ignore__',
            'module-b.js': '../shims/module/b',
            './only': '../shims/client-only'
          },
          sourceMap: undefined
        });

        t.equal(r.name, 'foo');
        t.equal(r.mainPath, 'index.js');
      },
      err => {
        t.fail(err.message);
      }
    ).then(t.end);
  });
});

test('packageReader uses browser replacement in package.json to normalize replacement in sub-folder, case2', t => {
  getReader('foo', {
    'node_modules/foo/package.json': `{
      "name": "foo",
      "main": "index",
      "browser": {
        "module-a": false,
        "module-b.js": "./shims/module/b.js",
        "./server/only.js": "shims/client-only.js"
      }
    }`,
    'node_modules/foo/index.js': 'lorem',
    'node_modules/foo/lib/bar.js': "require('module-a');require('module-b.js');require('module-c');require('../server/only.js');"
  }).then(r => {
    r.readResource('lib/bar').then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/lib/bar.js',
          contents: "require('module-a');require('module-b.js');require('module-c');require('../server/only.js');",
          moduleId: 'foo/lib/bar',
          packageName: 'foo',
          packageMainPath: 'index.js',
          replacement: {
            'module-a': '__ignore__',
            'module-b.js': '../shims/module/b',
            '../server/only': '../shims/client-only'
          },
          sourceMap: undefined
        });

        t.equal(r.name, 'foo');
        t.equal(r.mainPath, 'index.js');
      },
      err => {
        t.fail(err.message);
      }
    ).then(t.end);
  });
});

test('packageReader reads main file for package alias', t => {
  getReader({name: 'bar', location: 'node_modules/foo'}, {
    'node_modules/foo/package.json': '{"name":"foo", "main": "index"}',
    'node_modules/foo/index.js': "lorem"
  }).then(r => {
    r.readMain().then(
      unit => {
        t.equal(r.version, 'N/A');
        t.deepEqual(unit, {
          path: 'node_modules/foo/index.js',
          contents: 'lorem',
          moduleId: 'bar/index',
          packageName: 'bar',
          packageMainPath: 'index.js',
          alias: 'bar',
          sourceMap: undefined
        });

        t.equal(r.name, 'bar');
        t.equal(r.mainPath, 'index.js');
        t.deepEqual(r.browserReplacement, {});
      },
      err => {
        t.fail(err.message);
      }
    ).then(t.end);
  });
});

test('packageReader reads resource file for package alias', t => {
  getReader({name: 'bar', location: 'node_modules/foo'}, {
    'node_modules/foo/package.json': '{"name":"foo", "main": "index"}',
    'node_modules/foo/index.js': "lorem",
    'node_modules/foo/lo.js': "lorem2"
  }).then(r => {
    r.readResource('lo').then(
      unit => {
        t.equal(r.version, 'N/A');
        t.deepEqual(unit, {
          path: 'node_modules/foo/lo.js',
          contents: 'lorem2',
          moduleId: 'bar/lo',
          packageName: 'bar',
          packageMainPath: 'index.js',
          sourceMap: undefined
        });

        t.equal(r.name, 'bar');
        t.equal(r.mainPath, 'index.js');
        t.deepEqual(r.browserReplacement, {});
      },
      err => {
        t.fail(err.message);
      }
    ).then(t.end);
  });
});

test('packageReader reads traced file', t => {
  function _fileReader(filePath) {
    if (filePath === 'index.js') {
      return Promise.resolve({
        path: 'node_modules/foo/index.js',
        contents: 'traced',
        moduleId: 'foo/index',
        packageName: 'foo',
        packageMainPath: 'index.js',
        defined: ['foo/index', 'foo'],
        deps: []
      });
    } else if (filePath === 'package.json') {
      return Promise.resolve({
        path: 'node_modules/foo/package.json',
        contents: '{"name":"foo", "main": "index", "version": "1.0.0"}'
      });
    }
  }

  _fileReader.packageConfig = new Package('foo');
  const r = new PackageReader(_fileReader)
  r.readMain().then(
    unit => {
      t.equal(r.version, '1.0.0');
      t.deepEqual(unit, {
        path: 'node_modules/foo/index.js',
        contents: 'traced',
        moduleId: 'foo/index',
        packageName: 'foo',
        packageMainPath: 'index.js',
        defined: ['foo/index', 'foo'],
        deps: []
      });

      t.equal(r.name, 'foo');
      t.equal(r.mainPath, 'index.js');
      t.deepEqual(r.browserReplacement, {});
    },
    err => {
      t.fail(err.message);
    }
  ).then(t.end);
});