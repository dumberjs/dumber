const {test} = require('zora');
const Package = require('../lib/package');

test('package rejects invalid options', t => {
  t.throws(() => new Package());
  t.throws(() => new Package({}));
});

test('package takes simple package name', t => {
  const p = new Package('a');
  t.equal(p.name, 'a');
  t.equal(p.location, undefined);
  t.equal(p.main, undefined);
  t.equal(p.shim, undefined);
  t.notOk(p.lazyMain);
});

test('package takes options', t => {
  const p = new Package({name: 'a', location: 'f/a', lazyMain: true, version: '2.1.0'});
  t.equal(p.name, 'a');
  t.equal(p.location, 'f/a');
  t.equal(p.main, undefined);
  t.equal(p.version, '2.1.0');
  t.equal(p.shim, undefined);
  t.ok(p.lazyMain);
});

test('package takes options case2', t => {
  const p = new Package({name: 'a', location: 'f/a', main: './aa.js'});
  t.equal(p.name, 'a');
  t.equal(p.location, 'f/a');
  t.equal(p.main, './aa.js');
  t.equal(p.version, undefined);
  t.equal(p.shim, undefined);
  t.notOk(p.lazyMain);
});

test('package takes shim options', t => {
  const p = new Package({name: 'a', deps: ['b', 'c'], exports: 'A', wrapShim: true});
  t.equal(p.name, 'a');
  t.notOk(p.version);
  t.deepEqual(p.shim, {
    deps: ['b', 'c'],
    'exports': 'A',
    wrapShim: true
  });
  t.notOk(p.lazyMain);
});
