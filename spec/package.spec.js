import test from 'tape';
import Package from '../src/package';

test('package rejects invalid options', t => {
  t.throws(() => new Package());
  t.throws(() => new Package({}));
  t.end();
});

test('package takes simple package name', t => {
  const p = new Package('a');
  t.equal(p.name, 'a');
  t.equal(p.resources.length, 0);
  t.equal(p.shim, undefined);
  t.notOk(p.lazyMain);
  t.end();
});

test('package takes options', t => {
  const p = new Package({name: 'a', resources: ['foo/*'], lazyMain: true});
  t.equal(p.name, 'a');
  t.deepEqual(p.resources, ['foo/*']);
  t.equal(p.shim, undefined);
  t.ok(p.lazyMain);
  t.end();
});

test('package takes shim options', t => {
  const p = new Package({name: 'a', deps: ['b', 'c'], exports: 'A', wrapShim: true});
  t.equal(p.name, 'a');
  t.equal(p.resources.length, 0);
  t.deepEqual(p.shim, {
    deps: ['b', 'c'],
    'exports': 'A',
    wrapShim: true
  });
  t.notOk(p.lazyMain);
  t.end();
});
