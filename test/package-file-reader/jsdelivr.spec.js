const test = require('tape');
const jsdelivrFileReader = require('../../lib/package-file-reader/jsdelivr');
const {decode} = require('base64-arraybuffer');

function mkResponse (text) {
  return {
    ok: true,
    text: () => Promise.resolve(text)
  }
}

function mkJsonResponse (obj) {
  return {
    ok: true,
    json: () => Promise.resolve(obj)
  }
}

function mockFetch (url) {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (url === '//cdn.jsdelivr.net/npm/foo/package.json' ||
          url === '//cdn.jsdelivr.net/npm/foo@1.0.1/package.json') {
        resolve(mkResponse('{"name":"foo","version":"1.0.1"}'));

      } else if (url === '//cdn.jsdelivr.net/npm/foo@1.0.1/fib.wasm') {
        const base64 = 'AGFzbQEAAAABBgFgAX8BfwMCAQAHBwEDZmliAAAKHwEdACAAQQJIBEBBAQ8LIABBAmsQACAAQQFrEABqDws=';
        resolve({
          ok: true,
          arrayBuffer: () => Promise.resolve(decode(base64))
        });
      } else if (url === '//cdn.jsdelivr.net/npm/foo@1.0.1/dist/index.js') {
        resolve(mkResponse('lorem'));
      } else if (url === '//cdn.jsdelivr.net/npm/bar/package.json' ||
                 url === '//cdn.jsdelivr.net/npm/bar@1.9.0/package.json') {
        resolve(mkResponse('{"name":"bar","version":"1.9.0"}'));

      } else if (url === '//cdn.jsdelivr.net/npm/bar@2.0.0-rc1/package.json') {
        resolve(mkResponse('{"name":"bar","version":"2.0.0-rc1"}'));

      } else if (url === '//cdn.jsdelivr.net/npm/@scoped/pkg/package.json' ||
                 url === '//cdn.jsdelivr.net/npm/@scoped/pkg@1.0.0/package.json') {
        resolve(mkResponse('{"name":"@scoped/pkg","version":"1.0.0"}'));
      } else if (url === '//cdn.jsdelivr.net/npm/foo/dist' ||
          url === '//cdn.jsdelivr.net/npm/foo@1.0.1/dist') {
        resolve({ok: true, redirected: true});
      } else if (url === '//data.jsdelivr.com/v1/package/npm/foo@1.0.1') {
        resolve(mkJsonResponse({
          files: [
            {
              type: 'file',
              name: 'package.json'
            },
            {
              type: 'file',
              name: 'fib.wasm'
            },
            {
              type: 'directory',
              name: 'dist',
              files: [
                {
                  type: 'file',
                  name: 'index.js'
                }
              ]
            }
          ]
        }));
      } else if (url === '//data.jsdelivr.com/v1/package/npm/bar@1.9.0') {
        resolve(mkJsonResponse({
          files: [
            {
              type: 'file',
              name: 'package.json'
            }
          ]
        }));
      } else if (url === '//data.jsdelivr.com/v1/package/npm/bar@2.0.0-rc1') {
        resolve(mkJsonResponse({
          files: [
            {
              type: 'file',
              name: 'package.json'
            }
          ]
        }));
      } else if (url === '//data.jsdelivr.com/v1/package/npm/@scoped/pkg@1.0.0') {
        resolve(mkJsonResponse({
          files: [
            {
              type: 'file',
              name: 'package.json'
            }
          ]
        }));
      } else {
        resolve({statusText: 'Not Found'});
      }
    }, 10);
  });
}

const fileReader = function (packageConfig) {
  return jsdelivrFileReader(packageConfig, {fetch: mockFetch});
}

test('jsdelivrFileReader rejects missing package', t => {
  fileReader({name: 'nope'})
  .then(
    () => t.fail('should not pass'),
    () => t.pass('reject missing package')
  ).then(() => t.end());
});

test('jsdelivrFileReader returns fileRead func for existing package', t => {
  fileReader({name: 'foo'})
  .then(
    fileRead => {
      t.equal(fileRead.packageConfig.name, 'foo');
      return fileRead('package.json')
      .then(
        file => {
          t.equal(file.path, '//cdn.jsdelivr.net/npm/foo@1.0.1/package.json');
          const info = JSON.parse(file.contents);
          t.equal(info.name, 'foo');
          t.equal(info.version, '1.0.1');
        },
        err => t.fail(err.message)
      );
    },
    err => t.fail(err)
  ).then(() => t.end());
});

test('jsdelivrFileReader returns fileRead func for fixed package version', t => {
  fileReader({name: 'bar', version: '2.0.0-rc1'})
  .then(
    fileRead => {
      t.equal(fileRead.packageConfig.name, 'bar');
      t.equal(fileRead.packageConfig.version, '2.0.0-rc1');
      return fileRead('package.json')
      .then(
        file => {
          t.equal(file.path, '//cdn.jsdelivr.net/npm/bar@2.0.0-rc1/package.json');
          const info = JSON.parse(file.contents);
          t.equal(info.name, 'bar');
          t.equal(info.version, '2.0.0-rc1');
        },
        err => t.fail(err.message)
      );
    },
    err => t.fail(err)
  ).then(() => t.end());
});

test('jsdelivrFileReader returns fileRead func for alias package', t => {
  const l = fileReader({name: 'bar', location: 'foo', version: '1.0.1'});

  l.then(
    fileRead => {
      t.equal(fileRead.packageConfig.name, 'bar');
      t.equal(fileRead.packageConfig.location, 'foo');
      t.equal(fileRead.packageConfig.version, '1.0.1');
      return fileRead('package.json')
      .then(
        file => {
          t.equal(file.path, '//cdn.jsdelivr.net/npm/foo@1.0.1/package.json');
          const info = JSON.parse(file.contents);
          t.equal(info.name, 'bar');
          t.equal(info.version, '1.0.1');
        },
        err => t.fail(err.message)
      );
    },
    err => t.fail(err)
  ).then(() => t.end());
});

test('jsdelivrFileReader returns fileRead func rejects missing file for existing package', t => {
  fileReader({name: 'foo'})
  .then(
    fileRead => {
      return fileRead('nope.js')
      .then(
        () => t.fail('should not read non-existing file'),
        () => t.pass('rejects missing file')
      );
    },
    err => t.fail(err)
  ).then(() => t.end());
});

test('jsdelivrFileReader returns fileRead func for existing scoped package', t => {
  fileReader({name: '@scoped/pkg'})
  .then(
    fileRead => {
      return fileRead('package.json')
      .then(
        file => {
          t.equal(file.path, '//cdn.jsdelivr.net/npm/@scoped/pkg@1.0.0/package.json');
          const info = JSON.parse(file.contents);
          t.equal(info.name, '@scoped/pkg');
          t.equal(info.version, '1.0.0');
        },
        err => t.fail(err.message)
      );
    },
    err => t.fail(err)
  ).then(() => t.end());
});

test('jsdelivrFileReader returns fileRead func rejects missing file for existing scoped package', t => {
  fileReader({name: '@scoped/pkg'})
  .then(
    fileRead => {
      return fileRead('nope.js')
      .then(
        () => t.fail('should not read non-existing file'),
        () => t.pass('rejects missing file')
      );
    },
    err => t.fail(err)
  ).then(() => t.end());
});

test('jsdelivrFileReader rejects read on dir', t => {
  fileReader({name: 'foo'})
  .then(
    fileRead => {
      return fileRead('dist')
      .then(
        () => t.fail('should not read dir'),
        err => t.equal(err.message, 'no file "dist" in foo@1.0.1')
      );
    },
    err => t.fail(err)
  ).then(() => t.end());
});

test('jsdelivrFileReader reads nested file', t => {
  fileReader({name: 'foo'})
  .then(
    fileRead => {
      return fileRead('dist/index.js')
      .then(
        file => {
          t.equal(file.path, '//cdn.jsdelivr.net/npm/foo@1.0.1/dist/index.js');
          t.equal(file.contents, 'lorem');
        },
        err => t.fail(err.message)
      );
    },
    err => t.fail(err)
  ).then(() => t.end());
});

test('jsdelivrFileReader reads .wasm file to base64 string', t => {
  fileReader({name: 'foo'})
  .then(
    fileRead => {
      return fileRead('fib.wasm')
      .then(
        file => {
          t.equal(file.contents, 'AGFzbQEAAAABBgFgAX8BfwMCAQAHBwEDZmliAAAKHwEdACAAQQJIBEBBAQ8LIABBAmsQACAAQQFrEABqDws=');
        },
        err => t.fail(err)
      );
    },
    err => t.fail(err)
  ).then(() => t.end());
});

test('jsdelivrFileReader returns fileRead func for package with hard coded main', t => {
  fileReader({name: 'foo', main: 'lib/main'})
  .then(
    fileRead => {
      return fileRead('package.json')
      .then(
        file => {
          t.equal(file.path, '//cdn.jsdelivr.net/npm/foo@1.0.1/package.json');
          const info = JSON.parse(file.contents);
          t.equal(info.name, 'foo');
          t.equal(info.version, '1.0.1');
          t.equal(info.dumberForcedMain, 'lib/main');
        },
        err => t.fail(err.message)
      );
    },
    err => t.fail(err)
  ).then(() => t.end());
});

test('jsdelivrFileReader returns fileRead func for package with custom path and hard coded main', t => {
  fileReader({name: 'foo', location: 'bar@2.0.0-rc1', main: 'lib/main'})
  .then(
    fileRead => {
      return fileRead('package.json')
      .then(
        file => {
          t.equal(file.path, '//cdn.jsdelivr.net/npm/bar@2.0.0-rc1/package.json');
          const info = JSON.parse(file.contents);
          t.equal(info.name, 'foo');
          t.equal(info.version, '2.0.0-rc1');
          t.equal(info.dumberForcedMain, 'lib/main');
        },
        err => t.fail(err.message)
      );
    },
    err => t.fail(err)
  ).then(() => t.end());
});

test('jsdelivrFileReader returns fileRead func for package with custom path, version and hard coded main', t => {
  fileReader({name: 'foo', location: 'bar', version: '2.0.0-rc1', main: 'lib/main'})
  .then(
    fileRead => {
      return fileRead('./package.json')
      .then(
        file => {
          t.equal(file.path, '//cdn.jsdelivr.net/npm/bar@2.0.0-rc1/package.json');
          const info = JSON.parse(file.contents);
          t.equal(info.name, 'foo');
          t.equal(info.version, '2.0.0-rc1');
          t.equal(info.dumberForcedMain, 'lib/main');
        },
        err => t.fail(err.message)
      );
    },
    err => t.fail(err)
  ).then(() => t.end());
});
