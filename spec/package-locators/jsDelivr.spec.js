'use strict';
const test = require('tape');
const jsDelivrLocator = require('../../lib/package-locators/jsDelivr');
const fetch = require('node-fetch');

const locator = jsDelivrLocator({jquery: '2.2.4'}, function(url) {
  // need protocol to test node-fetch
  return fetch('http:' + url);
});

test('jsDelivrNpmPackageLocator rejects missing package', t => {
  locator('__make_sure__/__not_exist__')
  .then(
    () => t.fail('should not pass'),
    () => t.pass('reject missing package')
  ).then(() => t.end());
});

test('jsDelivrNpmPackageLocator returns fileRead func for existing package', t => {
  locator('lodash')
  .then(
    fileRead => {
      return fileRead('package.json')
      .then(
        file => {
          t.ok(file.path.startsWith('//cdn.jsdelivr.net/npm/lodash@'));
          t.ok(file.path.endsWith('/package.json'));
          const info = JSON.parse(file.contents);
          t.equal(info.name, 'lodash');
        },
        err => t.fail(err.message)
      );
    },
    () => t.fail('should not fail')
  ).then(() => t.end());
});

test('jsDelivrNpmPackageLocator returns fileRead func for fixed package version', t => {
  locator('jquery')
  .then(
    fileRead => {
      return fileRead('package.json')
      .then(
        file => {
          t.equal(file.path, '//cdn.jsdelivr.net/npm/jquery@2.2.4/package.json');
          const info = JSON.parse(file.contents);
          t.equal(info.name, 'jquery');
          t.equal(info.version, '2.2.4');
        },
        err => t.fail(err.message)
      );
    },
    () => t.fail('should not fail')
  ).then(() => t.end());
});

test('jsDelivrNpmPackageLocator returns fileRead func rejects missing file for existing package', t => {
  locator('lodash')
  .then(
    fileRead => {
      return fileRead('lorem/foo/bar/nope.js')
      .then(
        () => t.fail('should not read non-existing file'),
        () => t.pass('rejects missing file')
      );
    },
    () => t.fail('should not fail')
  ).then(() => t.end());
});

test('jsDelivrNpmPackageLocator returns fileRead func for existing scoped package', t => {
  locator('@babel/types')
  .then(
    fileRead => {
      return fileRead('package.json')
      .then(
        file => {
          t.ok(file.path.startsWith('//cdn.jsdelivr.net/npm/@babel/types@'));
          t.ok(file.path.endsWith('/package.json'));
          const info = JSON.parse(file.contents);
          t.equal(info.name, '@babel/types');
        },
        err => t.fail(err.message)
      );
    },
    () => t.fail('should not fail')
  ).then(() => t.end());
});

test('jsDelivrNpmPackageLocator returns fileRead func rejects missing file for existing scoped package', t => {
  locator('@babel/types')
  .then(
    fileRead => {
      return fileRead('lorem/foo/bar/nope.js')
      .then(
        () => t.fail('should not read non-existing file'),
        () => t.pass('rejects missing file')
      );
    },
    () => t.fail('should not fail')
  ).then(() => t.end());
});
