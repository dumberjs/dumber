const {test} = require('zora');
const PackageReader = require('../lib/package-reader');
const Package = require('../lib/package');
const {mockPackageFileReader, buildReadFile} = require('./mock');

function getReader(name, fakeFs) {
  const fakeReader = buildReadFile(fakeFs);
  return mockPackageFileReader(fakeReader)(new Package(name)).then(fileReader => new PackageReader(fileReader));
}

test('packageReader falls back to main:index when package.json is missing', async t => {
  return getReader('foo', {
    'node_modules/foo/index.js': "lorem"
  }).then(r => {
    return r.readMain().then(
      unit => {
        t.equal(r.version, 'N/A');
        t.deepEqual(unit, {
          path: 'node_modules/foo/index.js',
          contents: 'lorem',
          moduleId: 'foo/index.js',
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
    );
  });
});

test('packageReader rejects missing main', async t => {
  return getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "index", "version": "1.0.0"}'
  }).then(r => {
    return r.readMain().then(
      () => {
        t.fail('should not pass');
      },
      () => {
        t.equal(r.version, '1.0.0');
        t.ok(true, 'it throws');
      }
    );
  });
});

test('packageReader can still read resource when main is missing', async t => {
  return getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "index", "version": "1.0.0"}',
    'node_modules/foo/bar.js': 'lorem'
  }).then(r => {
    return r.readResource('bar').then(
      unit => {
        t.equal(r.version, '1.0.0');
        t.deepEqual(unit, {
          path: 'node_modules/foo/bar.js',
          contents: 'lorem',
          moduleId: 'foo/bar.js',
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
    );
  });
});

test('packageReader uses default index.js as main path if main file is missing but not required', async t => {
  return getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "foo", "version": "1.0.0"}',
    'node_modules/foo/bar.js': 'lorem'
  }).then(r => {
    return r.readResource('bar').then(
      unit => {
        t.equal(r.version, '1.0.0');
        t.deepEqual(unit, {
          path: 'node_modules/foo/bar.js',
          contents: 'lorem',
          moduleId: 'foo/bar.js',
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
    );
  });
});

test('packageReader reads main file', async t => {
  return getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "index"}',
    'node_modules/foo/index.js': "lorem"
  }).then(r => {
    return r.readMain().then(
      unit => {
        t.equal(r.version, 'N/A');
        t.deepEqual(unit, {
          path: 'node_modules/foo/index.js',
          contents: 'lorem',
          moduleId: 'foo/index.js',
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
    );
  });
});

test('packageReader reads resource file which is actually main', async t => {
  return getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "index"}',
    'node_modules/foo/index.js': "lorem"
  }).then(r => {
    return r.readResource('index').then(
      unit => {
        t.equal(r.version, 'N/A');
        t.deepEqual(unit, {
          path: 'node_modules/foo/index.js',
          contents: 'lorem',
          moduleId: 'foo/index.js',
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
    );
  });
});

test('packageReader tolerate invalid package.json', async t => {
  return getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "index"',
    'node_modules/foo/index.js': "lorem"
  }).then(r => {
    return r.readResource('index').then(
      unit => {
        t.equal(r.version, 'N/A');
        t.deepEqual(unit, {
          path: 'node_modules/foo/index.js',
          contents: 'lorem',
          moduleId: 'foo/index.js',
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
    );
  });
});

test('packageReader use default main index.js', async t => {
  return getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo"}',
    'node_modules/foo/index.js': "lorem"
  }).then(r => {
    return r.readMain().then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/index.js',
          contents: 'lorem',
          moduleId: 'foo/index.js',
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
    );
  });
});

test('packageReader reads module over main field', async t => {
  return getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "module": "es", "main": "index"}',
    'node_modules/foo/index.js': "lorem",
    'node_modules/foo/es.js': 'es',
  }).then(r => {
    return r.readMain().then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/es.js',
          contents: 'es',
          moduleId: 'foo/es.js',
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
    );
  });
});

test('packageReader reads browser over module/main field', async t => {
  return getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "browser": "br", "module": "es", "main": "index"}',
    'node_modules/foo/index.js': "lorem",
    'node_modules/foo/es.js': 'es',
    'node_modules/foo/br.js': 'br'
  }).then(r => {
    return r.readMain().then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/br.js',
          contents: 'br',
          moduleId: 'foo/br.js',
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
    );
  });
});

test('packageReader reads browser "." mapping over module/main field', async t => {
  return getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "browser": {".": "br"}, "module": "es", "main": "index"}',
    'node_modules/foo/index.js': "lorem",
    'node_modules/foo/es.js': 'es',
    'node_modules/foo/br.js': 'br'
  }).then(r => {
    return r.readMain().then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/br.js',
          contents: 'br',
          moduleId: 'foo/br.js',
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
    );
  });
});

test('packageReader reads exports mapping over module/main field', async t => {
  return getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "exports": "./br", "browser": {".": "index"}, "module": "es", "main": "index"}',
    'node_modules/foo/index.js': "lorem",
    'node_modules/foo/es.js': 'es',
    'node_modules/foo/br.js': 'br'
  }).then(r => {
    return r.readMain().then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/br.js',
          contents: 'br',
          moduleId: 'foo/br.js',
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
    );
  });
});

test('packageReader reads exports "." mapping over module/main field', async t => {
  return getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "exports": {".": "./br"}, "browser": {".": "index"}, "module": "es", "main": "index"}',
    'node_modules/foo/index.js': "lorem",
    'node_modules/foo/es.js': 'es',
    'node_modules/foo/br.js': 'br'
  }).then(r => {
    return r.readMain().then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/br.js',
          contents: 'br',
          moduleId: 'foo/br.js',
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
    );
  });
});

test('packageReader reads exports "import" mapping over module/main field', async t => {
  return getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "exports": {"import": "./br.js", "module": "./index", "browser": "./index", "require": "./index.js", "default": "./index"}, "browser": {".": "index"}, "module": "es", "main": "index"}',
    'node_modules/foo/index.js': "lorem",
    'node_modules/foo/es.js': 'es',
    'node_modules/foo/br.js': 'br'
  }).then(r => {
    return r.readMain().then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/br.js',
          contents: 'br',
          moduleId: 'foo/br.js',
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
    );
  });
});

test('packageReader reads exports "module" mapping', async t => {
  return getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "exports": {"module": "./br.js", "browser": "./index", "require": "./index.js", "default": "./index"}, "browser": {".": "index"}, "module": "es", "main": "index"}',
    'node_modules/foo/index.js': "lorem",
    'node_modules/foo/es.js': 'es',
    'node_modules/foo/br.js': 'br'
  }).then(r => {
    return r.readMain().then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/br.js',
          contents: 'br',
          moduleId: 'foo/br.js',
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
    );
  });
});

test('packageReader reads exports "browser" mapping', async t => {
  return getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "exports": {"browser": "./br.js", "require": "./index.js", "default": "./index"}, "browser": {".": "index"}, "module": "es", "main": "index"}',
    'node_modules/foo/index.js': "lorem",
    'node_modules/foo/es.js': 'es',
    'node_modules/foo/br.js': 'br'
  }).then(r => {
    return r.readMain().then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/br.js',
          contents: 'br',
          moduleId: 'foo/br.js',
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
    );
  });
});

test('packageReader reads exports "require" mapping', async t => {
  return getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "exports": {"require": "./br.js", "default": "./index"}, "browser": {".": "index"}, "module": "es", "main": "index"}',
    'node_modules/foo/index.js': "lorem",
    'node_modules/foo/es.js': 'es',
    'node_modules/foo/br.js': 'br'
  }).then(r => {
    return r.readMain().then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/br.js',
          contents: 'br',
          moduleId: 'foo/br.js',
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
    );
  });
});

test('packageReader reads exports based on NODE_ENV', async t => {
  await t.test('packageReader reads exports "development" mapping in development env', async t => {
    const oldNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    return getReader('foo', {
      'node_modules/foo/package.json': '{"name":"foo", "exports": {"development": "./br.js", "production": "./index"}, "browser": {".": "index"}, "module": "es", "main": "index"}',
      'node_modules/foo/index.js': "lorem",
      'node_modules/foo/es.js': 'es',
      'node_modules/foo/br.js': 'br'
    }).then(r => {
      return r.readMain().then(
        unit => {
          process.env.NODE_ENV = oldNodeEnv;
          t.deepEqual(unit, {
            path: 'node_modules/foo/br.js',
            contents: 'br',
            moduleId: 'foo/br.js',
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
          process.env.NODE_ENV = oldNodeEnv;
          t.fail(err.message);
        }
      );
    });
  });

  await t.test('packageReader reads exports "production" mapping in development env', async t => {
    const oldNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    return getReader('foo', {
      'node_modules/foo/package.json': '{"name":"foo", "exports": {"development": "./index.js", "production": "./br.js"}, "browser": {".": "index"}, "module": "es", "main": "index"}',
      'node_modules/foo/index.js': "lorem",
      'node_modules/foo/es.js': 'es',
      'node_modules/foo/br.js': 'br'
    }).then(r => {
      return r.readMain().then(
        unit => {
          process.env.NODE_ENV = oldNodeEnv;
          t.deepEqual(unit, {
            path: 'node_modules/foo/br.js',
            contents: 'br',
            moduleId: 'foo/br.js',
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
          process.env.NODE_ENV = oldNodeEnv;
          t.fail(err.message);
        }
      );
    });
  });
});

test('packageReader reads exports "default" mapping', async t => {
  return getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "exports": {"default": "./br.js"}, "browser": {".": "index"}, "module": "es", "main": "index"}',
    'node_modules/foo/index.js': "lorem",
    'node_modules/foo/es.js': 'es',
    'node_modules/foo/br.js': 'br'
  }).then(r => {
    return r.readMain().then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/br.js',
          contents: 'br',
          moduleId: 'foo/br.js',
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
    );
  });
});

test('packageReader reads exports nested condition mapping', async t => {
  return getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "exports": {"default": {"module": "./br.js"}}, "browser": {".": "index"}, "module": "es", "main": "index"}',
    'node_modules/foo/index.js': "lorem",
    'node_modules/foo/es.js': 'es',
    'node_modules/foo/br.js': 'br'
  }).then(r => {
    return r.readMain().then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/br.js',
          contents: 'br',
          moduleId: 'foo/br.js',
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
    );
  });
});

test('packageReader reads dumberForcedMain over browser/module/main field', async t => {
  return getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "exports": "./br", "browser": "br", "module": "es", "main": "index", "dumberForcedMain": "hc"}',
    'node_modules/foo/index.js': "lorem",
    'node_modules/foo/es.js': 'es',
    'node_modules/foo/br.js': 'br',
    'node_modules/foo/hc.js': 'hc',
  }).then(r => {
    return r.readMain().then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/hc.js',
          contents: 'hc',
          moduleId: 'foo/hc.js',
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
    );
  });
});

test('packageReader fails broken dumberForcedMain without fallback', async t => {
  return getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "version": "1.0.0", "browser": "br", "module": "es", "main": "index", "dumberForcedMain": "hc"}',
    'node_modules/foo/index.js': "lorem",
    'node_modules/foo/es.js': 'es',
    'node_modules/foo/br.js': 'br'
  }).then(r => {
    return r.readMain().then(
      () => {
        t.fail('should not pass');
      },
      () => {
        t.equal(r.version, '1.0.0');
        t.ok(true, 'it throws');
      }
    );
  });
});

test('packageReader reads main file with explicit ext', async t => {
  return getReader('foo.js', {
    'node_modules/foo.js/package.json': '{"name":"foo.js", "main": "./main.js"}',
    'node_modules/foo.js/main.js': "lorem"
  }).then(r => {
    return r.readMain().then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo.js/main.js',
          contents: 'lorem',
          moduleId: 'foo.js/main.js',
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
    );
  });
});

test('packageReader reads main file with non-js file', async t => {
  return getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "./main.css"}',
    'node_modules/foo/main.css': "lorem"
  }).then(r => {
    return r.readMain().then(
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
    );
  });
});

test('packageReader reads implicit main file', async t => {
  return getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "./lib"}',
    'node_modules/foo/lib/index.js': "lorem"
  }).then(r => {
    return r.readMain().then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/lib/index.js',
          contents: 'lorem',
          moduleId: 'foo/lib/index.js',
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
  });
});

test('packageReader rejects missing resource', async t => {
  return getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "lib/main"}',
    'node_modules/foo/lib/main.js': 'lorem',
    'node_modules/foo/lib/bar.js': 'lorem2'
  }).then(r => {
    return r.readResource('dist/bar').then(
      err => {
        t.fail(err.message);
      },
      () => {
        t.ok(true, 'it throws');
      }
    );
  });
});

test('packageReader reads resource', async t => {
  return getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "lib/main"}',
    'node_modules/foo/lib/main.js': 'lorem',
    'node_modules/foo/lib/bar.js': 'lorem2'
  }).then(r => {
    return r.readResource('lib/bar').then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/lib/bar.js',
          contents: 'lorem2',
          moduleId: 'foo/lib/bar.js',
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
    );
  });
});

test('packageReader reads relative resource', async t => {
  return getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "lib/main"}',
    'node_modules/foo/lib/main.js': 'lorem',
    'node_modules/foo/lib/bar.js': 'lorem2'
  }).then(r => {
    return r.readResource('bar').then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/lib/bar.js',
          contents: 'lorem2',
          moduleId: 'foo/lib/bar.js',
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
    );
  });
});

test('packageReader reads deep relative resource', async t => {
  return getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "dist/cjs/main"}',
    'node_modules/foo/dist/cjs/main.js': 'lorem',
    'node_modules/foo/dist/cjs/foo/bar.js': 'lorem2'
  }).then(r => {
    return r.readResource('foo/bar').then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/dist/cjs/foo/bar.js',
          contents: 'lorem2',
          moduleId: 'foo/dist/cjs/foo/bar.js',
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
    );
  });
});

test('packageReader reads deep relative resource which is actually main', async t => {
  return getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "dist/cjs/main"}',
    'node_modules/foo/dist/cjs/main.js': 'lorem',
  }).then(r => {
    return r.readResource('main').then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/dist/cjs/main.js',
          contents: 'lorem',
          moduleId: 'foo/dist/cjs/main.js',
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
    );
  });
});

test('packageReader reads json resouce', async t => {
  return getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "dist/cjs/main"}',
    'node_modules/foo/dist/cjs/main.js': 'lorem',
    'node_modules/foo/dist/cjs/foo/bar.json': '{"a":1}'
  }).then(r => {
    return r.readResource('foo/bar').then(
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
    );
  });
});

test('packageReader reads directory index.js', async t => {
  return getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "index"}',
    'node_modules/foo/index.js': 'lorem',
    'node_modules/foo/lib/index.js': 'lorem2'
  }).then(r => {
    return r.readResource('lib').then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/lib/index.js',
          contents: 'lorem2',
          moduleId: 'foo/lib/index.js',
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
    );
  });
});

test('packageReader reads directory index.json', async t => {
  return getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "index"}',
    'node_modules/foo/index.js': 'lorem',
    'node_modules/foo/lib/index.json': '{"a":1}'
  }).then(r => {
    return r.readResource('lib').then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/lib/index.json',
          contents: '{"a":1}',
          moduleId: 'foo/lib/index.json',
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
    );
  });
});

test('packageReader reads directory package.json', async t => {
  return getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "index"}',
    'node_modules/foo/index.js': 'lorem',
    'node_modules/foo/lib/package.json': '{"module":"es", "main":"index.js"}',
    'node_modules/foo/lib/es/index.js': 'es',
    'node_modules/foo/lib/index.js': 'index'
  }).then(r => {
    return r.readResource('lib').then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/lib/es/index.js',
          contents: 'es',
          moduleId: 'foo/lib/es/index.js',
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
    );
  });
});

test('packageReader complains broken directory package.json', async t => {
  return getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "index"}',
    'node_modules/foo/index.js': 'lorem',
    'node_modules/foo/lib/package.json': 'broken',
    'node_modules/foo/lib/es/index.js': 'es',
    'node_modules/foo/lib/index.js': 'index'
  }).then(r => {
    return r.readResource('lib').then(
      () => {
        t.fail('should not load');
      },
      err => {
        t.ok(true, err.message);
      }
    );
  });
});

test('packageReader reads browser replacement in package.json', async t => {
  return getReader('foo', {
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
    return r.readMain().then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/index.js',
          contents: 'lorem',
          moduleId: 'foo/index.js',
          packageName: 'foo',
          packageMainPath: 'index.js',
          alias: 'foo',
          replacement: {
            'module-a': '__ignore__',
            'module-b.js': './shims/module/b.js',
            './server/only.js': './shims/client-only.js'
          },
          sourceMap: undefined
        });

        t.equal(r.name, 'foo');
        t.equal(r.mainPath, 'index.js');
        t.deepEqual(r.browserReplacement, {
          'module-a': false,
          'module-b.js': './shims/module/b.js',
          './server/only.js': './shims/client-only.js'
        });
      },
      err => {
        t.fail(err.message);
      }
    );
  });
});

test('packageReader uses browser replacement in package.json to normalize replacement', async t => {
  return getReader('foo', {
    'node_modules/foo/package.json': `{
      "name": "foo",
      "main": "index",
      "browser": {
        "module-a": false,
        "module-b.js": "./shims/module/b.js",
        "./server/only.js": "./shims/client-only.js"
      }
    }`,
    'node_modules/foo/index.js': '',
    'node_modules/foo/shims/client-only.js': "require('module-a');require('module-b.js');require('module-c');"
  }).then(r => {
    return r.readResource('server/only.js').then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/shims/client-only.js',
          contents: "require('module-a');require('module-b.js');require('module-c');",
          moduleId: 'foo/shims/client-only.js',
          packageName: 'foo',
          packageMainPath: 'index.js',
          replacement: {
            'module-a': '__ignore__',
            'module-b.js': './module/b.js',
            '../server/only.js': './client-only.js'
          },
          alias: 'foo/server/only.js',
          sourceMap: undefined
        });

        t.equal(r.name, 'foo');
        t.equal(r.mainPath, 'index.js');
      },
      err => {
        t.fail(err.message);
      }
    );
  });
});

test('packageReader uses browser replacement in package.json to normalize replacement, case 2', async t => {
  return getReader('foo', {
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
    return r.readResource('server/only').then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/shims/client-only.js',
          contents: "require('module-a');require('module-b.js');require('module-c');",
          moduleId: 'foo/shims/client-only.js',
          packageName: 'foo',
          packageMainPath: 'index.js',
          replacement: {
            'module-a': '__ignore__',
            'module-b.js': './module/b.js',
            '../server/only.js': './client-only.js'
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
    );
  });
});

test('packageReader uses browser replacement in package.json to normalize main read', async t => {
  return getReader('foo', {
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
    return r.readMain().then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/browser.js',
          contents: "browser",
          moduleId: 'foo/browser.js',
          packageName: 'foo',
          packageMainPath: 'browser.js',
          alias: 'foo',
          replacement: { './index.js': './browser.js' },
          sourceMap: undefined
        });

        t.equal(r.name, 'foo');
        t.equal(r.mainPath, 'browser.js');
      },
      err => {
        t.fail(err.message);
      }
    );
  });
});

test('packageReader uses browser replacement in package.json to normalize resource read which is actually main', async t => {
  return getReader('foo', {
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
    return r.readResource('browser').then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/browser.js',
          contents: "browser",
          moduleId: 'foo/browser.js',
          packageName: 'foo',
          packageMainPath: 'browser.js',
          alias: 'foo',
          replacement: { './index.js': './browser.js' },
          sourceMap: undefined
        });

        t.equal(r.name, 'foo');
        t.equal(r.mainPath, 'browser.js');
      },
      err => {
        t.fail(err.message);
      }
    );
  });
});

test('packageReader uses browser replacement in package.json to normalize main replacement', async t => {
  return getReader('foo', {
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
    return r.readMain().then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/index.js',
          contents: "require('module-a');require('module-b.js');require('module-c');require('./server/only.js');",
          moduleId: 'foo/index.js',
          packageName: 'foo',
          packageMainPath: 'index.js',
          alias: 'foo',
          replacement: {
            'module-a': '__ignore__',
            'module-b.js': './shims/module/b.js',
            './server/only.js': './shims/client-only.js'
          },
          sourceMap: undefined
        });

        t.equal(r.name, 'foo');
        t.equal(r.mainPath, 'index.js');
      },
      err => {
        t.fail(err.message);
      }
    );
  });
});

test('packageReader uses browser replacement in package.json to normalize replacement in sub-folder', async t => {
  return getReader('foo', {
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
    return r.readResource('server/bar').then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/server/bar.js',
          contents: "require('module-a');require('module-b.js');require('module-c');require('./only.js');",
          moduleId: 'foo/server/bar.js',
          packageName: 'foo',
          packageMainPath: 'index.js',
          replacement: {
            'module-a': '__ignore__',
            'module-b.js': '../shims/module/b.js',
            './only.js': '../shims/client-only.js'
          },
          sourceMap: undefined
        });

        t.equal(r.name, 'foo');
        t.equal(r.mainPath, 'index.js');
      },
      err => {
        t.fail(err.message);
      }
    );
  });
});

test('packageReader uses browser replacement in package.json to normalize replacement in sub-folder, case2', async t => {
  return getReader('foo', {
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
    return r.readResource('lib/bar').then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/lib/bar.js',
          contents: "require('module-a');require('module-b.js');require('module-c');require('../server/only.js');",
          moduleId: 'foo/lib/bar.js',
          packageName: 'foo',
          packageMainPath: 'index.js',
          replacement: {
            'module-a': '__ignore__',
            'module-b.js': '../shims/module/b.js',
            '../server/only.js': '../shims/client-only.js'
          },
          sourceMap: undefined
        });

        t.equal(r.name, 'foo');
        t.equal(r.mainPath, 'index.js');
      },
      err => {
        t.fail(err.message);
      }
    );
  });
});

test('packageReader uses browser "." replacement in package.json to normalize main read', async t => {
  return getReader('foo', {
    'node_modules/foo/package.json': `{
      "name": "foo",
      "main": "index",
      "browser": {
        "foo": "./local-foo.js",
        ".": "./browser.js"
      }
    }`,
    'node_modules/foo/index.js': "index",
    'node_modules/foo/browser.js': "browser"
  }).then(r => {
    return r.readMain().then(
      unit => {
        t.deepEqual(unit, {
          path: 'node_modules/foo/browser.js',
          contents: "browser",
          moduleId: 'foo/browser.js',
          packageName: 'foo',
          packageMainPath: 'browser.js',
          alias: 'foo',
          replacement: { 'foo': './local-foo.js' },
          sourceMap: undefined
        });

        t.equal(r.name, 'foo');
        t.equal(r.mainPath, 'browser.js');
      },
      err => {
        t.fail(err.message);
      }
    );
  });
});

test('packageReader reads main file for package alias', async t => {
  return getReader({name: 'bar', location: 'node_modules/foo'}, {
    'node_modules/foo/package.json': '{"name":"foo", "main": "index"}',
    'node_modules/foo/index.js': "lorem"
  }).then(r => {
    return r.readMain().then(
      unit => {
        t.equal(r.version, 'N/A');
        t.deepEqual(unit, {
          path: 'node_modules/foo/index.js',
          contents: 'lorem',
          moduleId: 'bar/index.js',
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
    );
  });
});

test('packageReader reads resource file for package alias', async t => {
  return getReader({name: 'bar', location: 'node_modules/foo'}, {
    'node_modules/foo/package.json': '{"name":"foo", "main": "index"}',
    'node_modules/foo/index.js': "lorem",
    'node_modules/foo/lo.js': "lorem2"
  }).then(r => {
    return r.readResource('lo').then(
      unit => {
        t.equal(r.version, 'N/A');
        t.deepEqual(unit, {
          path: 'node_modules/foo/lo.js',
          contents: 'lorem2',
          moduleId: 'bar/lo.js',
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
    );
  });
});

test('packageReader reads traced file', async t => {
  function _fileReader(filePath) {
    if (filePath === 'index.js') {
      return Promise.resolve({
        path: 'node_modules/foo/index.js',
        contents: 'traced',
        moduleId: 'foo/index.js',
        packageName: 'foo',
        packageMainPath: 'index.js',
        defined: ['foo/index.js', 'foo'],
        deps: []
      });
    } else if (filePath === 'package.json') {
      return Promise.resolve({
        path: 'node_modules/foo/package.json',
        contents: '{"name":"foo", "main": "index", "version": "1.0.0"}'
      });
    }
    return Promise.reject();
  }

  function _exists(filePath) {
    return Promise.resolve(filePath === 'package.json' || filePath === 'index.js');
  }

  _fileReader.exists = _exists;
  _fileReader.packageConfig = new Package('foo');
  const r = new PackageReader(_fileReader)
  return r.readMain().then(
    unit => {
      t.equal(r.version, '1.0.0');
      t.deepEqual(unit, {
        path: 'node_modules/foo/index.js',
        contents: 'traced',
        moduleId: 'foo/index.js',
        packageName: 'foo',
        packageMainPath: 'index.js',
        defined: ['foo/index.js', 'foo'],
        deps: []
      });

      t.equal(r.name, 'foo');
      t.equal(r.mainPath, 'index.js');
      t.deepEqual(r.browserReplacement, {});
    },
    err => {
      t.fail(err.message);
    }
  );
});

test('packageReader reads main file with troublesome name', async t => {
  return getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "index.cjs.js"}',
    'node_modules/foo/index.cjs.js': "lorem"
  }).then(r => {
    return r.readMain().then(
      unit => {
        t.equal(r.version, 'N/A');
        t.deepEqual(unit, {
          path: 'node_modules/foo/index.cjs.js',
          contents: 'lorem',
          moduleId: 'foo/index.cjs.js',
          packageName: 'foo',
          packageMainPath: 'index.cjs.js',
          alias: 'foo',
          sourceMap: undefined
        });

        t.equal(r.name, 'foo');
        t.equal(r.mainPath, 'index.cjs.js');
        t.deepEqual(r.browserReplacement, {});
      },
      err => {
        t.fail(err.message);
      }
    );
  });
});

test('packageReader reads mjs main file', async t => {
  return getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "index.mjs"}',
    'node_modules/foo/index.mjs': "lorem"
  }).then(r => {
    return r.readMain().then(
      unit => {
        t.equal(r.version, 'N/A');
        t.deepEqual(unit, {
          path: 'node_modules/foo/index.mjs',
          contents: 'lorem',
          moduleId: 'foo/index.mjs',
          packageName: 'foo',
          packageMainPath: 'index.mjs',
          alias: 'foo',
          sourceMap: undefined
        });

        t.equal(r.name, 'foo');
        t.equal(r.mainPath, 'index.mjs');
        t.deepEqual(r.browserReplacement, {});
      },
      err => {
        t.fail(err.message);
      }
    );
  });
});

test('packageReader reads mjs resource file', async t => {
  return getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "index.mjs"}',
    'node_modules/foo/index.mjs': "index",
    'node_modules/foo/bar.mjs': "lorem"
  }).then(r => {
    return r.readResource('bar.mjs').then(
      unit => {
        t.equal(r.version, 'N/A');
        t.deepEqual(unit, {
          path: 'node_modules/foo/bar.mjs',
          contents: 'lorem',
          moduleId: 'foo/bar.mjs',
          packageName: 'foo',
          packageMainPath: 'index.mjs',
          sourceMap: undefined
        });

        t.equal(r.name, 'foo');
        t.equal(r.mainPath, 'index.mjs');
        t.deepEqual(r.browserReplacement, {});
      },
      err => {
        t.fail(err.message);
      }
    );
  });
});

test('packageReader reads cjs main file', async t => {
  return getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "index.cjs"}',
    'node_modules/foo/index.cjs': "lorem"
  }).then(r => {
    return r.readMain().then(
      unit => {
        t.equal(r.version, 'N/A');
        t.deepEqual(unit, {
          path: 'node_modules/foo/index.cjs',
          contents: 'lorem',
          moduleId: 'foo/index.cjs',
          packageName: 'foo',
          packageMainPath: 'index.cjs',
          alias: 'foo',
          sourceMap: undefined
        });

        t.equal(r.name, 'foo');
        t.equal(r.mainPath, 'index.cjs');
        t.deepEqual(r.browserReplacement, {});
      },
      err => {
        t.fail(err.message);
      }
    );
  });
});

test('packageReader reads cjs resource file', async t => {
  return getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "index.cjs"}',
    'node_modules/foo/index.cjs': "index",
    'node_modules/foo/bar.cjs': "lorem"
  }).then(r => {
    return r.readResource('bar.cjs').then(
      unit => {
        t.equal(r.version, 'N/A');
        t.deepEqual(unit, {
          path: 'node_modules/foo/bar.cjs',
          contents: 'lorem',
          moduleId: 'foo/bar.cjs',
          packageName: 'foo',
          packageMainPath: 'index.cjs',
          sourceMap: undefined
        });

        t.equal(r.name, 'foo');
        t.equal(r.mainPath, 'index.cjs');
        t.deepEqual(r.browserReplacement, {});
      },
      err => {
        t.fail(err.message);
      }
    );
  });
});

test('packageReader reads module field main file when browser field is broken', async t => {
  return getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "index", "module": "esm.js", "browser": "br.js"}',
    'node_modules/foo/index.js': "lorem",
    'node_modules/foo/esm.js': "lorem2"
  }).then(r => {
    return r.readMain().then(
      unit => {
        t.equal(r.version, 'N/A');
        t.deepEqual(unit, {
          path: 'node_modules/foo/esm.js',
          contents: 'lorem2',
          moduleId: 'foo/esm.js',
          packageName: 'foo',
          packageMainPath: 'esm.js',
          alias: 'foo',
          sourceMap: undefined
        });

        t.equal(r.name, 'foo');
        t.equal(r.mainPath, 'esm.js');
        t.deepEqual(r.browserReplacement, {});
      },
      err => {
        t.fail(err.message);
      }
    );
  });
});

test('packageReader reads main field main file when browser field is broken', async t => {
  return getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "index", "browser": "br.js"}',
    'node_modules/foo/index.js': "lorem"
  }).then(r => {
    return r.readMain().then(
      unit => {
        t.equal(r.version, 'N/A');
        t.deepEqual(unit, {
          path: 'node_modules/foo/index.js',
          contents: 'lorem',
          moduleId: 'foo/index.js',
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
    );
  });
});

test('packageReader reads main field main file when module field is broken', async t => {
  return getReader('foo', {
    'node_modules/foo/package.json': '{"name":"foo", "main": "index", "module": "esm.js"}',
    'node_modules/foo/index.js': "lorem"
  }).then(r => {
    return r.readMain().then(
      unit => {
        t.equal(r.version, 'N/A');
        t.deepEqual(unit, {
          path: 'node_modules/foo/index.js',
          contents: 'lorem',
          moduleId: 'foo/index.js',
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
    );
  });
});

test('packageReader reads exports subpaths in package.json', async t => {
  const r = await getReader('foo', {
    'node_modules/foo/package.json': `{
      "name": "foo",
      "exports": {
        ".": "./index.js",
        "./package.json": "./package.json",
        "./a": "./a.js",
        "./b": "./be.js",
        "./c": {"import": "./lib/c.js"},
        "./d/*": "./lib/d/*.js",
        "./e": null
      }
    }`,
    'node_modules/foo/index.js': 'lorem',
    'node_modules/foo/a.js': 'a',
    'node_modules/foo/b.js': 'b',
    'node_modules/foo/be.js': 'be',
    'node_modules/foo/lib/c.js': 'c',
    'node_modules/foo/lib/d/x.js': 'x',
    'node_modules/foo/lib/d/y/z.js': 'yz',
    'node_modules/foo/e.js': 'e',
  });


  let unit = await r.readMain();
  t.equal(r.name, 'foo');
  t.equal(r.mainPath, 'index.js');
  t.deepEqual(r.exportsReplacement, {
    './b': './be.js',
    './c': './lib/c.js',
    './d/*': './lib/d/*.js',
    './e': null
  });

  t.deepEqual(unit, {
    path: 'node_modules/foo/index.js',
    contents: 'lorem',
    moduleId: 'foo/index.js',
    packageName: 'foo',
    packageMainPath: 'index.js',
    alias: 'foo',
    sourceMap: undefined
  });

  unit = await r.readResource('a', true);

  t.deepEqual(unit, {
    path: 'node_modules/foo/a.js',
    contents: 'a',
    moduleId: 'foo/a.js',
    packageName: 'foo',
    packageMainPath: 'index.js',
    sourceMap: undefined
  });

  unit = await r.readResource('b');

  t.deepEqual(unit, {
    path: 'node_modules/foo/be.js',
    contents: 'be',
    moduleId: 'foo/be.js',
    packageName: 'foo',
    packageMainPath: 'index.js',
    alias: 'foo/b',
    sourceMap: undefined
  });

  // FIXME local require on b uses module id foo/b
  // that conflicts with global require('foo/b') from user code
  unit = await r.readResource('b', true);

  t.deepEqual(unit, {
    path: 'node_modules/foo/b.js',
    contents: 'b',
    moduleId: 'foo/b.js',
    packageName: 'foo',
    packageMainPath: 'index.js',
    sourceMap: undefined
  });

  unit = await r.readResource('c');

  t.deepEqual(unit, {
    path: 'node_modules/foo/lib/c.js',
    contents: 'c',
    moduleId: 'foo/lib/c.js',
    packageName: 'foo',
    packageMainPath: 'index.js',
    alias: 'foo/c',
    sourceMap: undefined
  });

  unit = await r.readResource('d/x');

  t.deepEqual(unit, {
    path: 'node_modules/foo/lib/d/x.js',
    contents: 'x',
    moduleId: 'foo/lib/d/x.js',
    packageName: 'foo',
    packageMainPath: 'index.js',
    alias: 'foo/d/x',
    sourceMap: undefined
  });

  unit = await r.readResource('d/y/z');

  t.deepEqual(unit, {
    path: 'node_modules/foo/lib/d/y/z.js',
    contents: 'yz',
    moduleId: 'foo/lib/d/y/z.js',
    packageName: 'foo',
    packageMainPath: 'index.js',
    alias: 'foo/d/y/z',
    sourceMap: undefined
  });

  try {
    await r.readResource('e');
    t.fail('should not readResource "e"');
  } catch (err) {
    t.equal(err.message, "Resource foo/e is not allowed to be imported (foo package.json exports definition {\"./b\":\"./be.js\",\"./c\":\"./lib/c.js\",\"./d/*\":\"./lib/d/*.js\",\"./e\":null}).");
  }
});
