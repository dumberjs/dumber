import test from 'tape';
import _defaultLocator from '../../src/package-locators/default';

function resolve(path) {
  return 'node_modules/' + path;
}

function buildReadFile(fakeFs) {
  return path => {
    if (fakeFs[path]) return Promise.resolve(fakeFs[path]);
    return Promise.reject('no file at ' + path);
  };
}

function defaultLocator(packageConfig, fakeFs = {}) {
  return _defaultLocator(packageConfig, {resolve, readFile: buildReadFile(fakeFs)});
}

test('defaultNpmPackageLocator rejects missing package.json', t => {
  defaultLocator({name: 'foo'})
  .then(
    fileRead => {
      return fileRead('package.json')
      .then(
        () => t.fail('should not pass'),
        e => t.pass(e.message)
      );
    },
    err => t.fail(err.message)
  )
  .then(() => {
    t.end();
  });
});

test('defaultNpmPackageLocator returns fileRead func for existing package', t => {
  defaultLocator({name: 'foo'}, {
    'node_modules/foo/package.json': 'lorem'
  })
  .then(
    fileRead => {
      return fileRead('package.json')
      .then(
        file => {
          t.ok(file.path.endsWith('node_modules/foo/package.json'));
          t.equal(file.contents, 'lorem');
        },
        err => t.fail(err.message)
      );
    },
    () => t.fail('should not fail')
  )
  .then(() => {
    t.end();
  });
});

test('defaultNpmPackageLocator returns fileRead func for package with hard coded main', t => {
  defaultLocator({name: 'foo', main: 'lib/main'}, {
    'node_modules/foo/package.json': '{"name":"foo","main":"index.js"}'
  })
  .then(
    fileRead => {
      return fileRead('package.json')
      .then(
        file => {
          t.ok(file.path.endsWith('node_modules/foo/package.json'));
          t.deepEqual(JSON.parse(file.contents), {name: 'foo', main: 'lib/main'});
        },
        err => t.fail(err.message)
      );
    },
    () => t.fail('should not fail')
  )
  .then(() => {
    t.end();
  });
});

test('defaultNpmPackageLocator returns fileRead func for package with custom path', t => {
  defaultLocator({name: 'foo', location: 'packages/foo'}, {
    'packages/foo/package.json': 'lorem'
  })
  .then(
    fileRead => {
      return fileRead('package.json')
      .then(
        file => {
          t.ok(file.path.endsWith('packages/foo/package.json'));
          t.equal(file.contents, 'lorem');
        },
        err => t.fail(err.message)
      );
    },
    () => t.fail('should not fail')
  )
  .then(() => {
    t.end();
  });
});

test('defaultNpmPackageLocator returns fileRead func for package with custom path and hard coded main', t => {
  defaultLocator({name: 'foo', location: 'packages/foo', main: 'lib/main'}, {
    'packages/foo/package.json': '{"name":"foo","main":"index.js"}'
  })
  .then(
    fileRead => {
      return fileRead('package.json')
      .then(
        file => {
          t.ok(file.path.endsWith('packages/foo/package.json'));
          t.deepEqual(JSON.parse(file.contents), {name: 'foo', main: 'lib/main'});
        },
        err => t.fail(err.message)
      );
    },
    () => t.fail('should not fail')
  )
  .then(() => {
    t.end();
  });
});

test('defaultNpmPackageLocator can read parent node_modules folder', t => {
  _defaultLocator({name: 'foo'}, {
    resolve: function(path) { return '../node_modules/' + path; },
    readFile: buildReadFile({
      '../node_modules/foo/package.json': 'lorem'
    })
  })
  .then(
    fileRead => {
      return fileRead('package.json')
      .then(
        file => {
          t.ok(file.path.endsWith('node_modules/foo/package.json'));
          t.equal(file.contents, 'lorem');
        },
        err => t.fail(err.message)
      );
    },
    () => t.fail('should not fail')
  )
  .then(() => {
    t.end();
  });
});

test('defaultNpmPackageLocator returns fileRead func rejects missing file for existing package', t => {
  defaultLocator({name: 'foo'}, {
    'node_modules/foo/package.json': 'lorem'
  })
  .then(
    fileRead => {
      return fileRead('nope')
      .then(
        () => t.fail('should not read non-existing file'),
        () => t.pass('rejects missing file')
      );
    },
    () => t.fail('should not fail')
  )
  .then(() => {
    t.end();
  });
});

test('defaultNpmPackageLocator returns fileRead func for existing scoped package', t => {
  defaultLocator({name: '@bar/foo'}, {
    'node_modules/@bar/foo/package.json': 'lorem'
  })
  .then(
    fileRead => {
      return fileRead('package.json')
      .then(
        file => {
          t.ok(file.path.endsWith('node_modules/@bar/foo/package.json'));
          t.equal(file.contents, 'lorem');
        },
        err => t.fail(err.message)
      );
    },
    () => t.fail('should not fail')
  )
  .then(() => {
    t.end();
  });
});

test('defaultNpmPackageLocator returns fileRead func rejects missing file for existing scoped package', t => {
  defaultLocator({name: '@bar/foo'}, {
    'node_modules/@bar/foo/package.json': 'lorem'
  })
  .then(
    fileRead => {
      return fileRead('nope')
      .then(
        () => t.fail('should not read non-existing file'),
        () => t.pass('rejects missing file')
      );
    },
    () => t.fail('should not fail')
  )
  .then(() => {
    t.end();
  });
});
