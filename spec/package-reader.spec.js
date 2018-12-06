import test from 'tape';
import PackageReader from '../src/package-reader';
import Package from '../src/package';
import {mockLocator, buildReadFile} from './mock';

function getReader(name, fakeFs) {
  const fakeReader = buildReadFile(fakeFs);
  return mockLocator(fakeReader)(new Package(name)).then(locator => new PackageReader(locator));
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
          packageName: 'foo'
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
      err => {
        t.fail(err.message);
      },
      () => {
        t.equal(r.version, '1.0.0');
        t.pass('it throws');
      }
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
          packageName: 'foo'
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

test('packageReader rejects invalid package.json', t => {
  getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "index"',
    'node_modules/foo/index.js': "lorem"
  }).then(r => {
    r.readMain().then(
      () => {
        t.fail('should not pass')
      },
      err => {
        t.pass(err.message);
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
          packageName: 'foo'
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
          packageName: 'foo'
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

test('packageReader reads browser over main/module field', t => {
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
          packageName: 'foo'
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

test('packageReader reads main file with explicit ext', t => {
  getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "./main.js"}',
    'node_modules/foo/main.js': "lorem"
  }).then(r => {
    r.readMain().then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/main.js',
          contents: 'lorem',
          moduleId: 'foo/main',
          packageName: 'foo'
        });

        t.equal(r.name, 'foo');
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
          packageName: 'foo'
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
          packageName: 'foo'
        });

        t.equal(r.name, 'foo');
        t.equal(r.mainPath, 'lib/index.js');
        t.deepEqual(r.browserReplacement, {});
      },
      err => {
        console.log('err', err);
        t.fail(err.message);
      }
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
          packageName: 'foo'
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
          packageName: 'foo'
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
          packageName: 'foo'
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
          packageName: 'foo'
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
          packageName: 'foo'
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
          packageName: 'foo'
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
          packageName: 'foo'
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
          packageName: 'foo'
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

test('packageReader uses browser replacement in package.json to normalize file contents', t => {
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
          contents: "require('__ignore__');require('./shims/module/b');require('module-c');require('./shims/client-only');",
          moduleId: 'foo/index',
          packageName: 'foo'
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

test('packageReader uses browser replacement in package.json to normalize file contents in sub-folder', t => {
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
          contents: "require('__ignore__');require('../shims/module/b');require('module-c');require('../shims/client-only');",
          moduleId: 'foo/server/bar',
          packageName: 'foo'
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

test('packageReader uses browser replacement in package.json to normalize file contents in sub-folder, case2', t => {
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
          contents: "require('__ignore__');require('../shims/module/b');require('module-c');require('../shims/client-only');",
          moduleId: 'foo/lib/bar',
          packageName: 'foo'
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
