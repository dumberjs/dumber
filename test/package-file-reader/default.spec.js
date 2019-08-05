const test = require('tape');
const path = require('path');
const fs = require('fs');
const {buildReadFile, mockPackageFileReader} = require('../mock');
const _defaultFileReader = require('../../lib/package-file-reader/default');

test('defaultNpmPackageFileReader falls back to main:index when package.json is missing', t => {
  const defaultFileReader = mockPackageFileReader(buildReadFile());
  defaultFileReader({name: 'foo'})
  .then(
    fileRead => {
      return fileRead('package.json')
      .then(
        file => {
          t.equal(file.path, 'node_modules/foo/package.json');
          t.equal(file.contents, '{"name":"foo","main":"index"}');
        },
        err => t.fail(err.stack)
      );
    },
    err => t.fail(err.stack)
  )
  .then(() => {
    t.end();
  });
});

test('defaultNpmPackageFileReader returns fileRead func for existing package', t => {
  const defaultFileReader = mockPackageFileReader(buildReadFile({
    'node_modules/foo/package.json': '{"name":"foo"}'
  }));

  defaultFileReader({name: 'foo'})
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
  )
  .then(() => {
    t.end();
  });
});

test('defaultNpmPackageFileReader returns fileRead func for package with hard coded main', t => {
  const defaultFileReader = mockPackageFileReader(buildReadFile({
    'node_modules/foo/package.json': '{"name":"foo","main":"index.js","version":"2.1.0"}'
  }));

  defaultFileReader({name: 'foo', main: 'lib/main'})
  .then(
    fileRead => {
      return fileRead('package.json')
      .then(
        file => {
          t.equal(file.path, 'node_modules/foo/package.json');
          t.deepEqual(JSON.parse(file.contents), {name: 'foo', main: 'lib/main', version: '2.1.0'});
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

test('defaultNpmPackageFileReader returns fileRead func for package with custom path', t => {
  const defaultFileReader = mockPackageFileReader(buildReadFile({
    'packages/foo/package.json': '{"name":"foo"}'
  }));

  defaultFileReader({name: 'foo', location: 'packages/foo'})
  .then(
    fileRead => {
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
  )
  .then(() => {
    t.end();
  });
});

test('defaultNpmPackageFileReader returns fileRead func for package with custom path and hard coded main', t => {
  const defaultFileReader = mockPackageFileReader(buildReadFile({
    'packages/foo/package.json': '{"name":"foo","main":"index.js","version":"1.2.0"}'
  }));

  defaultFileReader({name: 'foo', location: 'packages/foo', main: 'lib/main'})
  .then(
    fileRead => {
      return fileRead('package.json')
      .then(
        file => {
          t.equal(file.path, 'packages/foo/package.json');
          t.deepEqual(JSON.parse(file.contents), {name: 'foo', main: 'lib/main', version: '1.2.0'});
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

test('defaultNpmPackageFileReader returns fileRead func for package with custom path and hard coded main, with missing real package.json', t => {
  const defaultFileReader = mockPackageFileReader(buildReadFile());

  defaultFileReader({name: 'foo', location: 'packages/foo', main: 'lib/main'})
  .then(
    fileRead => {
      return fileRead('package.json')
      .then(
        file => {
          t.equal(file.path, 'packages/foo/package.json');
          t.deepEqual(JSON.parse(file.contents), {name: 'foo', main: 'lib/main', version: 'N/A'});
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

test('defaultNpmPackageFileReader can read parent node_modules folder', t => {
  _defaultFileReader({name: 'foo'}, {
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
    () => t.fail('should not fail')
  )
  .then(() => {
    t.end();
  });
});

test('defaultNpmPackageFileReader returns fileRead func rejects missing file for existing package', t => {
  const defaultFileReader = mockPackageFileReader(buildReadFile({
    'node_modules/foo/package.json': '{"name":"foo"}'
  }));

  defaultFileReader({name: 'foo'})
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

test('defaultNpmPackageFileReader returns fileRead func for existing scoped package', t => {
  const defaultFileReader = mockPackageFileReader(buildReadFile({
    'node_modules/@bar/foo/package.json': '{"name":"@bar/foo"}'
  }));

  defaultFileReader({name: '@bar/foo'})
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
  )
  .then(() => {
    t.end();
  });
});

test('defaultNpmPackageFileReader returns fileRead func rejects missing file for existing scoped package', t => {
  const defaultFileReader = mockPackageFileReader(buildReadFile({
    'node_modules/@bar/foo/package.json': '{"name":"@bar/foo"}'
  }));

  defaultFileReader({name: '@bar/foo'})
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

test('defaultNpmPackageFileReader can read .wasm file into base64 string', t => {
  const defaultFileReader = mockPackageFileReader(buildReadFile({
    'node_modules/foo/fib.wasm': fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'fib.wasm'))
  }));

  defaultFileReader({name: 'foo'})
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
  )
  .then(() => {
    t.end();
  });
});

test('defaultNpmPackageFileReader returns fileRead func for package alias', t => {
  const defaultFileReader = mockPackageFileReader(buildReadFile({
    'node_modules/foo/package.json': '{"name":"foo","main":"index"}'
  }));

  defaultFileReader({name: 'bar', location: 'node_modules/foo'})
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
  )
  .then(() => {
    t.end();
  });
});

