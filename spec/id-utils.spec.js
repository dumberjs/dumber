'use strict';
const test = require('tape');
const idUtils = require('../lib/id-utils');
const resolveModuleId = idUtils.resolveModuleId;
const ext = idUtils.ext;
const parse = idUtils.parse;

test('ext finds known extname of id', t => {
  t.equal(ext('a.js'), '.js');
  t.equal(ext('a.JS'), '.js');
  t.equal(ext('a.html'), '.html');
  t.equal(ext('a.css'), '.css');
  t.equal(ext('a.json'), '.json');
  t.equal(ext('a.min'), '');
  t.equal(ext('a'), '');
  t.end();
});

test('parse parses id', t => {
  t.deepEqual(parse('a/b'), {prefix: '', bareId: 'a/b', parts: ['a', 'b'], ext: ''});
  t.deepEqual(parse('a/b.js'), {prefix: '', bareId: 'a/b', parts: ['a', 'b'], ext: ''});
  t.deepEqual(parse('a/b.json'), {prefix: '', bareId: 'a/b.json', parts: ['a', 'b.json'], ext: '.json'});
  t.deepEqual(parse('a/b.svg'), {prefix: '', bareId: 'a/b.svg', parts: ['a', 'b.svg'], ext: '.svg'});
  t.deepEqual(parse('../a/b.svg'), {prefix: '', bareId: '../a/b.svg', parts: ['..', 'a', 'b.svg'], ext: '.svg'});
  t.end();
});

test('parse parses id with plugin prefix', t => {
  t.deepEqual(parse('text!a/b'), {prefix: 'text!', bareId: 'a/b', parts: ['a', 'b'], ext: ''});
  t.deepEqual(parse('text!a/b.js'), {prefix: 'text!', bareId: 'a/b', parts: ['a', 'b'], ext: ''});
  t.deepEqual(parse('text!a/b.json'), {prefix: 'text!', bareId: 'a/b.json', parts: ['a', 'b.json'], ext: '.json'});
  t.deepEqual(parse('text!a/b.svg'), {prefix: 'text!', bareId: 'a/b.svg', parts: ['a', 'b.svg'], ext: '.svg'});
  t.deepEqual(parse('text!../a/b.svg'), {prefix: 'text!', bareId: '../a/b.svg', parts: ['..', 'a', 'b.svg'], ext: '.svg'});
  t.end();
});

test('parse parses id with scope', t => {
  t.deepEqual(parse('@s/a/b'), {prefix: '', bareId: '@s/a/b', parts: ['@s/a', 'b'], ext: ''});
  t.deepEqual(parse('@s/a/b.js'), {prefix: '', bareId: '@s/a/b', parts: ['@s/a', 'b'], ext: ''});
  t.deepEqual(parse('text!@s/a/b.json'), {prefix: 'text!', bareId: '@s/a/b.json', parts: ['@s/a', 'b.json'], ext: '.json'});
  t.end();
});

test('resolveModuleId returns non-relative id', t => {
  t.equal(resolveModuleId('base', 'foo'), 'foo');
  t.equal(resolveModuleId('base/lo.js', 'foo'), 'foo');
  t.equal(resolveModuleId('base', 'foo/bar.js'), 'foo/bar');
  t.equal(resolveModuleId('base/lo', 'foo/bar'), 'foo/bar');
  t.end();
});

test('resolveModuleId returns resolved relative id', t => {
  t.equal(resolveModuleId('base', './foo'), 'foo');
  t.equal(resolveModuleId('base/lo', './foo'), 'base/foo');
  t.equal(resolveModuleId('base', './foo/bar'), 'foo/bar');
  t.equal(resolveModuleId('base/lo', '././foo/bar'), 'base/foo/bar');
  t.end();
});

test('resolveModuleId returns resolved relative id ..', t => {
  t.equal(resolveModuleId('base', '../foo'), '../foo');
  t.equal(resolveModuleId('base/lo', '../foo'), 'foo');
  t.equal(resolveModuleId('base', '../foo/bar'), '../foo/bar');
  t.equal(resolveModuleId('base/lo', '.././foo/bar'), 'foo/bar');
  t.end();
});

test('resolveModuleId returns resolved relative id for scoped package', t => {
  t.equal(resolveModuleId('@scope/base', './foo'), 'foo');
  t.equal(resolveModuleId('@scope/base/lo', './foo'), '@scope/base/foo');
  t.equal(resolveModuleId('@scope/base', './foo/bar'), 'foo/bar');
  t.equal(resolveModuleId('@scope/base/lo', '././foo/bar'), '@scope/base/foo/bar');
  t.end();
});

test('resolveModuleId returns resolved relative id .. for scoped package', t => {
  t.equal(resolveModuleId('@scope/base', '../foo'), '../foo');
  t.equal(resolveModuleId('@scope/base/lo', '../foo'), 'foo');
  t.equal(resolveModuleId('@scope/base', '../foo/bar'), '../foo/bar');
  t.equal(resolveModuleId('@scope/base/lo', '.././foo/bar'), 'foo/bar');
  t.end();
});

test('resolveModuleId returns non-relative id with prefix', t => {
  t.equal(resolveModuleId('base', 'text!foo'), 'foo');
  t.equal(resolveModuleId('base/lo', 'text!foo'), 'foo');
  t.equal(resolveModuleId('text!base', 'text!foo/bar'), 'foo/bar');
  t.equal(resolveModuleId('text!base/lo', 'text!foo/bar'), 'foo/bar');
  t.end();
});

test('resolveModuleId returns resolved relative id with prefix', t => {
  t.equal(resolveModuleId('base', 'text!./foo'), 'foo');
  t.equal(resolveModuleId('base/lo', 'text!./foo'), 'base/foo');
  t.equal(resolveModuleId('text!base', 'text!./foo/bar'), 'foo/bar');
  t.equal(resolveModuleId('text!base/lo', 'text!././foo/bar'), 'base/foo/bar');
  t.end();
});

test('resolveModuleId returns resolved relative id .. with prefix', t => {
  t.equal(resolveModuleId('base', 'text!../foo'), '../foo');
  t.equal(resolveModuleId('base/lo', 'text!../foo'), 'foo');
  t.equal(resolveModuleId('text!base', 'text!../foo/bar'), '../foo/bar');
  t.equal(resolveModuleId('text!base/lo', 'text!.././foo/bar'), 'foo/bar');
  t.end();
});

test('resolveModuleId returns resolved relative id for scoped package with prefix', t => {
  t.equal(resolveModuleId('@scope/base', 'text!./foo'), 'foo');
  t.equal(resolveModuleId('@scope/base/lo', 'text!./foo'), '@scope/base/foo');
  t.equal(resolveModuleId('text!@scope/base', 'text!./foo/bar'), 'foo/bar');
  t.equal(resolveModuleId('text!@scope/base/lo', 'text!././foo/bar'), '@scope/base/foo/bar');
  t.end();
});

test('resolveModuleId returns resolved relative id .. for scoped package with prefix', t => {
  t.equal(resolveModuleId('@scope/base', 'text!../foo'), '../foo');
  t.equal(resolveModuleId('@scope/base/lo', 'text!../foo'), 'foo');
  t.equal(resolveModuleId('text!@scope/base', 'text!../foo/bar'), '../foo/bar');
  t.equal(resolveModuleId('text!@scope/base/lo', 'text!.././foo/bar'), 'foo/bar');
  t.end();
});

test('resolveModuleId returns clean id', t => {
  t.equal(resolveModuleId('base', 'foo.js'), 'foo');
  t.equal(resolveModuleId('base', 'foo.json'), 'foo.json');
  t.equal(resolveModuleId('base/bar', './foo.js'), 'base/foo');
  t.equal(resolveModuleId('base/bar', '../foo.html'), 'foo.html');
  t.equal(resolveModuleId('@scope/base', 'foo.js'), 'foo');
  t.equal(resolveModuleId('@scope/base', 'foo.json'), 'foo.json');
  t.equal(resolveModuleId('@scope/base', 'text!./foo.js'), 'foo');
  t.equal(resolveModuleId('@scope/base', 'text!../foo.html'), '../foo.html');
  t.equal(resolveModuleId('@scope/base/bar', 'text!./foo.js'), '@scope/base/foo');
  t.equal(resolveModuleId('@scope/base/bar', 'text!../foo.html'), 'foo.html');
  t.end();
});
