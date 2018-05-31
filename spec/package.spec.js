'use strict';
const test = require('tape');
const Package = require('../lib/package');

test('package rejects invalid options', t => {
  t.throws(() => new Package());
  t.throws(() => new Package({}));
  t.end();
});

test('package takes simple package name', t => {
  const p = new Package('a');
  t.equal(p.name, 'a');
  t.equal(p.resources.length, 0);
  t.equal(p.deps, undefined);
  t.equal(p.exports, undefined);
  t.notOk(p.wrapShim);
  t.notOk(p.lazyMain);
  t.end();
});

test('package takes options', t => {
  const p = new Package({name: 'a', resources: ['foo/*'], lazyMain: true});
  t.equal(p.name, 'a');
  t.deepEqual(p.resources, ['foo/*']);
  t.equal(p.deps, undefined);
  t.equal(p.exports, undefined);
  t.notOk(p.wrapShim);
  t.ok(p.lazyMain);
  t.end();
});

test('package takes shim options', t => {
  const p = new Package({name: 'a', deps: ['b', 'c'], exports: 'A', wrapShim: true});
  t.equal(p.name, 'a');
  t.equal(p.resources.length, 0);
  t.deepEqual(p.deps, ['b', 'c']);
  t.deepEqual(p.exports, 'A');
  t.ok(p.wrapShim);
  t.notOk(p.lazyMain);
  t.end();
});