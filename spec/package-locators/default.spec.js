import test from 'tape';
import path from 'path';
import fs from 'fs';
import {buildReadFile, mockLocator} from '../mock';
import _defaultLocator from '../../src/package-locators/default';

test('defaultNpmPackageLocator falls back to main:index when package.json is missing', t => {
  const defaultLocator = mockLocator(buildReadFile());
  defaultLocator({name: 'foo'})
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

test('defaultNpmPackageLocator returns fileRead func for existing package', t => {
  const defaultLocator = mockLocator(buildReadFile({
    'node_modules/foo/package.json': 'lorem'
  }));

  defaultLocator({name: 'foo'})
  .then(
    fileRead => {
      return fileRead('package.json')
      .then(
        file => {
          t.equal(file.path, 'node_modules/foo/package.json');
          t.equal(file.contents, 'lorem');
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

test('defaultNpmPackageLocator returns fileRead func for package with hard coded main', t => {
  const defaultLocator = mockLocator(buildReadFile({
    'node_modules/foo/package.json': '{"name":"foo","main":"index.js"}'
  }));

  defaultLocator({name: 'foo', main: 'lib/main'})
  .then(
    fileRead => {
      return fileRead('package.json')
      .then(
        file => {
          t.equal(file.path, 'node_modules/foo/package.json');
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
  const defaultLocator = mockLocator(buildReadFile({
    'packages/foo/package.json': 'lorem'
  }));

  defaultLocator({name: 'foo', location: 'packages/foo'})
  .then(
    fileRead => {
      return fileRead('package.json')
      .then(
        file => {
          t.equal(file.path, 'packages/foo/package.json');
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
  const defaultLocator = mockLocator(buildReadFile({
    'packages/foo/package.json': '{"name":"foo","main":"index.js"}'
  }));

  defaultLocator({name: 'foo', location: 'packages/foo', main: 'lib/main'})
  .then(
    fileRead => {
      return fileRead('package.json')
      .then(
        file => {
          t.equal(file.path, 'packages/foo/package.json');
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

test('defaultNpmPackageLocator returns fileRead func for package with custom path and hard coded main, with missing real package.json', t => {
  const defaultLocator = mockLocator(buildReadFile());

  defaultLocator({name: 'foo', location: 'packages/foo', main: 'lib/main'})
  .then(
    fileRead => {
      return fileRead('package.json')
      .then(
        file => {
          t.equal(file.path, 'packages/foo/package.json');
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
          t.equal(file.path, '../node_modules/foo/package.json');
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
  const defaultLocator = mockLocator(buildReadFile({
    'node_modules/foo/package.json': 'lorem'
  }));

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
    t.end();
  });
});

test('defaultNpmPackageLocator returns fileRead func for existing scoped package', t => {
  const defaultLocator = mockLocator(buildReadFile({
    'node_modules/@bar/foo/package.json': 'lorem'
  }));

  defaultLocator({name: '@bar/foo'})
  .then(
    fileRead => {
      return fileRead('package.json')
      .then(
        file => {
          t.equal(file.path, 'node_modules/@bar/foo/package.json');
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
  const defaultLocator = mockLocator(buildReadFile({
    'node_modules/@bar/foo/package.json': 'lorem'
  }));

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
    t.end();
  });
});

test('defaultNpmPackageLocator can read .wasm file into base64 string', t => {
  const defaultLocator = mockLocator(buildReadFile({
    'node_modules/foo/fib.wasm': fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'fib.wasm'))
  }));

  defaultLocator({name: 'foo'})
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
