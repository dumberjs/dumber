'use strict';
const test = require('tape');
const _defaultLocator = require('../../lib/package-locators/default');
const mock = require('mock-fs');

function resolveMock(path) {
  return 'node_modules/' + path;
}

function defaultLocator(packageConfig) {
  return _defaultLocator(packageConfig, {resolve: resolveMock});
}

test('defaultNpmPackageLocator rejects missing package', t => {
  mock();

  defaultLocator({name: 'foo'})
  .then(
    () => t.fail('should not pass'),
    () => t.pass('reject missing package')
  )
  .then(() => {
    mock.restore();
    t.end();
  });
});

test('defaultNpmPackageLocator returns fileRead func for existing package', t => {
  mock({
    'node_modules/foo/package.json': 'lorem'
  });

  defaultLocator({name: 'foo'})
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
    mock.restore();
    t.end();
  });
});

test('defaultNpmPackageLocator returns fileRead func for package with hard coded main', t => {
  mock({
    'node_modules/foo/package.json': '{"name":"foo","main":"index.js"}'
  });

  defaultLocator({name: 'foo', main: 'lib/main'})
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
    mock.restore();
    t.end();
  });
});

test('defaultNpmPackageLocator returns fileRead func for package with custom path', t => {
  mock({
    'packages/foo/package.json': 'lorem'
  });

  defaultLocator({name: 'foo', path: 'packages/foo'})
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
    mock.restore();
    t.end();
  });
});

test('defaultNpmPackageLocator returns fileRead func for package with custom path and hard coded main', t => {
  mock({
    'packages/foo/package.json': '{"name":"foo","main":"index.js"}'
  });

  defaultLocator({name: 'foo', path: 'packages/foo', main: 'lib/main'})
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
    mock.restore();
    t.end();
  });
});

test('defaultNpmPackageLocator can read parent node_modules folder', t => {
  mock({
    '../node_modules/foo/package.json': 'lorem'
  });

  _defaultLocator({name: 'foo'}, {
    resolve: function(path) { return '../node_modules/' + path; }
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
    mock.restore();
    t.end();
  });
});

test('defaultNpmPackageLocator returns fileRead func rejects missing file for existing package', t => {
  mock({
    'node_modules/foo/package.json': 'lorem'
  });

  defaultLocator({name: 'foo'})
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
    mock.restore();
    t.end();
  });
});

test('defaultNpmPackageLocator returns fileRead func for existing scoped package', t => {
  mock({
    'node_modules/@bar/foo/package.json': 'lorem'
  });

  defaultLocator({name: '@bar/foo'})
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
    mock.restore();
    t.end();
  });
});

test('defaultNpmPackageLocator returns fileRead func rejects missing file for existing scoped package', t => {
  mock({
    'node_modules/@bar/foo/package.json': 'lorem'
  });

  defaultLocator({name: '@bar/foo'})
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
    mock.restore();
    t.end();
  });
});
