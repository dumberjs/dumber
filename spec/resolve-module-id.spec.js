'use strict';
const test = require('tape');
const resolve = require('../lib/resolve-module-id');

test('resolveModuleId returns non-relative id', t => {
  t.equal(resolve('base', 'foo'), 'foo');
  t.equal(resolve('base/lo', 'foo'), 'foo');
  t.equal(resolve('base', 'foo/bar'), 'foo/bar');
  t.equal(resolve('base/lo', 'foo/bar'), 'foo/bar');
  t.end();
});

test('resolveModuleId returns resolved relative id', t => {
  t.equal(resolve('base', './foo'), 'foo');
  t.equal(resolve('base/lo', './foo'), 'base/foo');
  t.equal(resolve('base', './foo/bar'), 'foo/bar');
  t.equal(resolve('base/lo', '././foo/bar'), 'base/foo/bar');
  t.end();
});

test('resolveModuleId returns resolved relative id ..', t => {
  t.throws(() => resolve('base', '../foo'));
  t.equal(resolve('base/lo', '../foo'), 'foo');
  t.throws(() => resolve('base', '../foo/bar'));
  t.equal(resolve('base/lo', '.././foo/bar'), 'foo/bar');
  t.end();
});

test('resolveModuleId returns resolved relative id for scoped package', t => {
  t.equal(resolve('@scope/base', './foo'), 'foo');
  t.equal(resolve('@scope/base/lo', './foo'), '@scope/base/foo');
  t.equal(resolve('@scope/base', './foo/bar'), 'foo/bar');
  t.equal(resolve('@scope/base/lo', '././foo/bar'), '@scope/base/foo/bar');
  t.end();
});

test('resolveModuleId returns resolved relative id .. for scoped package', t => {
  t.throws(() => resolve('@scope/base', '../foo'));
  t.equal(resolve('@scope/base/lo', '../foo'), 'foo');
  t.throws(() => resolve('@scope/base', '../foo/bar'));
  t.equal(resolve('@scope/base/lo', '.././foo/bar'), 'foo/bar');
  t.end();
});
