const {test} = require('zora');
const path = require('path');
const fs = require('fs');
const {buildReadFile, mockPackageFileReader} = require('../mock');
const _defaultFileReader = require('../../lib/package-file-reader/node');

test('defaultNpmPackageFileReader falls back to main:index when package.json is missing', async t => {
  const defaultFileReader = mockPackageFileReader(buildReadFile());
  return defaultFileReader({name: 'foo'})
  .then(
    fileRead => {
      t.equal(fileRead.packageConfig.name, 'foo');
      return fileRead('package.json')
      .then(
        file => {
          t.equal(file.path, 'node_modules/foo/package.json');
          t.deepEqual(JSON.parse(file.contents), {name:'foo',main:'index',version:'N/A'});
        },
        err => t.fail(err.stack)
      );
    },
    err => t.fail(err.stack)
  );
});

test('defaultNpmPackageFileReader returns fileRead func for existing package', async t => {
  const defaultFileReader = mockPackageFileReader(buildReadFile({
    'node_modules/foo/package.json': '{"name":"foo"}'
  }));

  return defaultFileReader({name: 'foo'})
  .then(
    fileRead => {
      return fileRead('package.json')
      .then(
        file => {
          t.equal(file.path, 'node_modules/foo/package.json');
          t.equal(file.contents, '{"name":"foo"}');
        },
        err => t.fail(err.stack)
      );
    },
    err => t.fail(err.stack)
  );
});

test('defaultNpmPackageFileReader returns fileRead func for package with hard coded main', async t => {
  const defaultFileReader = mockPackageFileReader(buildReadFile({
    'node_modules/foo/package.json': '{"name":"foo","main":"index.js","version":"2.1.0"}'
  }));

  return defaultFileReader({name: 'foo', main: 'lib/main'})
  .then(
    fileRead => {
      t.equal(fileRead.packageConfig.name, 'foo');
      t.equal(fileRead.packageConfig.main, 'lib/main');
      return fileRead('package.json')
      .then(
        file => {
          t.equal(file.path, 'node_modules/foo/package.json');
          t.deepEqual(JSON.parse(file.contents), {name: 'foo', main: 'index.js', dumberForcedMain: 'lib/main', version: '2.1.0'});
        },
        err => t.fail(err.message)
      );
    },
    () => t.fail('should not fail')
  );
});

test('defaultNpmPackageFileReader returns fileRead func for package with custom path', async t => {
  const defaultFileReader = mockPackageFileReader(buildReadFile({
    'packages/foo/package.json': '{"name":"foo"}'
  }));

  return defaultFileReader({name: 'foo', location: 'packages/foo'})
  .then(
    fileRead => {
      t.equal(fileRead.packageConfig.name, 'foo');
      t.equal(fileRead.packageConfig.location, 'packages/foo');
      return fileRead('package.json')
      .then(
        file => {
          t.equal(file.path, 'packages/foo/package.json');
          t.equal(file.contents, '{"name":"foo"}');
        },
        err => t.fail(err.message)
      );
    },
    () => t.fail('should not fail')
  );
});

test('defaultNpmPackageFileReader returns fileRead func for package with custom path and hard coded main', async t => {
  const defaultFileReader = mockPackageFileReader(buildReadFile({
    'packages/bar/package.json': '{"name":"bar","main":"index.js","version":"1.2.0"}'
  }));

  return defaultFileReader({name: 'foo', location: 'packages/bar', main: 'lib/main'})
  .then(
    fileRead => {
      return fileRead('package.json')
      .then(
        file => {
          t.equal(file.path, 'packages/bar/package.json');
          t.deepEqual(JSON.parse(file.contents), {name: 'foo', main: 'index.js', dumberForcedMain: 'lib/main', version: '1.2.0'});
        },
        err => t.fail(err.message)
      );
    },
    () => t.fail('should not fail')
  );
});

test('defaultNpmPackageFileReader returns fileRead func for package with custom path and hard coded main, with missing real package.json', async t => {
  const defaultFileReader = mockPackageFileReader(buildReadFile());

  return defaultFileReader({name: 'foo', location: 'packages/foo', main: 'lib/main'})
  .then(
    fileRead => {
      return fileRead('package.json')
      .then(
        file => {
          t.equal(file.path, 'packages/foo/package.json');
          t.deepEqual(JSON.parse(file.contents), {name: 'foo', main: 'index', dumberForcedMain: 'lib/main', version: 'N/A'});
        },
        err => t.fail(err.message)
      );
    },
    () => t.fail('should not fail')
  );
});

test('defaultNpmPackageFileReader can read parent node_modules folder', async t => {
  return _defaultFileReader({name: 'foo'}, {
    resolve: function(path) { return '../node_modules/' + path; },
    readFile: buildReadFile({
      '../node_modules/foo/package.json': '{"name":"foo"}'
    })
  })
  .then(
    fileRead => {
      return fileRead('package.json')
      .then(
        file => {
          t.equal(file.path, '../node_modules/foo/package.json');
          t.equal(file.contents, '{"name":"foo"}');
        },
        err => t.fail(err.message)

      );
    },
    err => t.fail(err.message)
  );
});

test('defaultNpmPackageFileReader returns fileRead func rejects missing file for existing package', async t => {
  const defaultFileReader = mockPackageFileReader(buildReadFile({
    'node_modules/foo/package.json': '{"name":"foo"}'
  }));

  return defaultFileReader({name: 'foo'})
  .then(
    fileRead => {
      return fileRead('nope')
      .then(
        () => t.fail('should not read non-existing file'),
        () => t.ok(true, 'rejects missing file')
      );
    },
    () => t.fail('should not fail')
  );
});

test('defaultNpmPackageFileReader returns fileRead func for existing scoped package', async t => {
  const defaultFileReader = mockPackageFileReader(buildReadFile({
    'node_modules/@bar/foo/package.json': '{"name":"@bar/foo"}'
  }));

  return defaultFileReader({name: '@bar/foo'})
  .then(
    fileRead => {
      return fileRead('package.json')
      .then(
        file => {
          t.equal(file.path, 'node_modules/@bar/foo/package.json');
          t.equal(file.contents, '{"name":"@bar/foo"}');
        },
        err => t.fail(err.message)
      );
    },
    () => t.fail('should not fail')
  );
});

test('defaultNpmPackageFileReader returns fileRead func rejects missing file for existing scoped package', async t => {
  const defaultFileReader = mockPackageFileReader(buildReadFile({
    'node_modules/@bar/foo/package.json': '{"name":"@bar/foo"}'
  }));

  return defaultFileReader({name: '@bar/foo'})
  .then(
    fileRead => {
      return fileRead('nope')
      .then(
        () => t.fail('should not read non-existing file'),
        () => t.ok(true, 'rejects missing file')
      );
    },
    () => t.fail('should not fail')
  );
});

test('defaultNpmPackageFileReader can read .wasm file into base64 string', async t => {
  const defaultFileReader = mockPackageFileReader(buildReadFile({
    'node_modules/foo/fib.wasm': fs.readFileSync(path.join(__dirname, '..', '..', 'fixtures', 'fib.wasm'))
  }));

  return defaultFileReader({name: 'foo'})
  .then(
    fileRead => {
      return fileRead('fib.wasm')
      .then(
        file => {
          t.equal(file.path, 'node_modules/foo/fib.wasm');
          t.equal(file.contents, 'AGFzbQEAAAABBgFgAX8BfwMCAQAHBwEDZmliAAAKHwEdACAAQQJIBEBBAQ8LIABBAmsQACAAQQFrEABqDws=');
        },
        err => t.fail(err.stack)
      );
    },
    err => t.fail(err.stack)
  );
});

test('defaultNpmPackageFileReader returns fileRead func for package alias', async t => {
  const defaultFileReader = mockPackageFileReader(buildReadFile({
    'node_modules/foo/package.json': '{"name":"foo","main":"index"}'
  }));

  return defaultFileReader({name: 'bar', location: 'node_modules/foo'})
  .then(
    fileRead => {
      return fileRead('package.json')
      .then(
        file => {
          t.equal(file.path, 'node_modules/foo/package.json');
          t.equal(file.contents, '{"name":"bar","main":"index"}');
        },
        err => t.fail(err.message)
      );
    },
    () => t.fail('should not fail')
  );
});

test('defaultNpmPackageFileReader returns fileRead.exists func', async t => {
  const defaultFileReader = mockPackageFileReader(buildReadFile({
    'node_modules/foo/package.json': '{"name":"foo","version":"1.0.0","main":"index.js"}',
    'node_modules/foo/index.js': 'lorem'
  }));

  return defaultFileReader({name: 'foo'})
  .then(
    fileRead => {
      return Promise.all([
        fileRead.exists('package.json'),
        fileRead.exists('index.js'),
        fileRead.exists('./index.js'),
        fileRead.exists('index'),
        fileRead.exists('./nope'),
        fileRead.exists('nope.js')
      ])
      .then(
        results => {
          t.deepEqual(results, [
            true,
            true,
            true,
            false,
            false,
            false
          ]);
        },
        err => t.fail(err.stack)
      );
    },
    err => t.fail(err.stack)
  );
});
