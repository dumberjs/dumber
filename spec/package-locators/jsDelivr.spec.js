import test from 'tape';
import jsDelivrLocator from '../../src/package-locators/jsDelivr';
import {decode} from 'base64-arraybuffer';

function mkResponse (text) {
  return {
    ok: true,
    text: () => Promise.resolve(text)
  }
}

function mockFetch (url) {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (url.endsWith('foo/package.json') ||
          url.endsWith('foo@1.0.1/package.json')) {
        resolve(mkResponse('{"name":"foo","version":"1.0.1"}'));

      } else if (url.endsWith('foo@1.0.1/fib.wasm')) {
        const base64 = 'AGFzbQEAAAABBgFgAX8BfwMCAQAHBwEDZmliAAAKHwEdACAAQQJIBEBBAQ8LIABBAmsQACAAQQFrEABqDws=';
        resolve({
          ok: true,
          arrayBuffer: () => Promise.resolve(decode(base64))
        });
      } else if (url.endsWith('bar/package.json') ||
                 url.endsWith('bar@1.9.0/package.json')) {
        resolve(mkResponse('{"name":"bar","version":"1.9.0"}'));

      } else if (url.endsWith('bar@2.0.0-rc1/package.json')) {
        resolve(mkResponse('{"name":"bar","version":"2.0.0-rc1"}'));

      } else if (url.endsWith('@scoped/pkg/package.json') ||
                 url.endsWith('@scoped/pkg@1.0.0/package.json')) {
        resolve(mkResponse('{"name":"@scoped/pkg","version":"1.0.0"}'));
      } else if (url.endsWith('foo/dist') ||
          url.endsWith('foo@1.0.1/dist')) {
        resolve({ok: true, redirected: true});
      } else {
        resolve({statusText: 'Not Found'});
      }
    }, 10);
  });
}

const locator = function (packageConfig) {
  return jsDelivrLocator(packageConfig, {fetch: mockFetch});
}

test('jsDelivrNpmPackageLocator rejects missing package', t => {
  locator({name: 'nope'})
  .then(
    () => t.fail('should not pass'),
    () => t.pass('reject missing package')
  ).then(() => t.end());
});

test('jsDelivrNpmPackageLocator returns fileRead func for existing package', t => {
  locator({name: 'foo'})
  .then(
    fileRead => {
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

test('jsDelivrNpmPackageLocator returns fileRead func for fixed package version', t => {
  locator({name: 'bar', version: '2.0.0-rc1'})
  .then(
    fileRead => {
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

test('jsDelivrNpmPackageLocator returns fileRead func for alias package', t => {
  const l = locator({name: 'bar', location: 'foo', version: '1.0.1'});

  l.then(
    fileRead => {
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

test('jsDelivrNpmPackageLocator returns fileRead func rejects missing file for existing package', t => {
  locator({name: 'foo'})
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

test('jsDelivrNpmPackageLocator returns fileRead func for existing scoped package', t => {
  locator({name: '@scoped/pkg'})
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

test('jsDelivrNpmPackageLocator returns fileRead func rejects missing file for existing scoped package', t => {
  locator({name: '@scoped/pkg'})
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

test('jsDelivrNpmPackageLocator rejects read on dir', t => {
  locator({name: 'foo'})
  .then(
    fileRead => {
      return fileRead('dist')
      .then(
        () => t.fail('should not read dir'),
        err => t.equal(err.message, 'it is a directory')
      );
    },
    err => t.fail(err)
  ).then(() => t.end());
});

test('jsDelivrNpmPackageLocator reads .wasm file to base64 string', t => {
  locator({name: 'foo'})
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