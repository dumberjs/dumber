'use strict';
const test = require('tape');
const defaultLocator = require('../../lib/package-locators/default');
const mock = require('mock-fs');

test('defaultNpmPackageLocator rejects missing package', t => {
  mock();

  defaultLocator('foo')
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

  defaultLocator('foo')
  .then(
    fileRead => {
      return fileRead('package.json')
      .then(
        contents => t.equal(contents.toString(), 'lorem'),
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

  defaultLocator('foo')
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

  defaultLocator('@bar/foo')
  .then(
    fileRead => {
      return fileRead('package.json')
      .then(
        contents => t.equal(contents.toString(), 'lorem'),
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

  defaultLocator('@bar/foo')
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
