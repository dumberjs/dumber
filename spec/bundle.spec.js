'use strict';
const test = require('tape');
const Bundle = require('../lib/bundle');

test('bundle rejects missing bundle name', t => {
  t.throws(() => new Bundle());
  t.throws(() => new Bundle({contain: 'app.js'}));
  t.end();
});

test('bundle builds bundle with name, prepends and dependencies', t => {
  const a = new Bundle({name: 'a'});
  t.equal(a.name, 'a');
  t.equal(a.prepends.length, 0);
  t.equal(a.dependencies.length, 0);

  const b = new Bundle({
    name: 'b',
    prepends: ['c', 'd'],
    dependencies: ['foo', 'bar']
  });
  t.equal(b.name, 'b');
  t.deepEqual(b.prepends, ['c', 'd']);
  t.deepEqual(b.dependencies, ['foo', 'bar']);
  t.end();
});

test('bundle supports no pattern', t => {
  const b = new Bundle({name: 'b'});
  t.notOk(b.match({path: 'src/app.js', moduleId: 'app'}));
  t.notOk(b.match({path: 'node_modules/foo/index.js', moduleId: 'foo/index', packageName: 'foo'}));
  t.end();
});

test('bundle supports plain pattern match', t => {
  const b = new Bundle({name: 'b', contain: 'src/app.js'});
  t.ok(b.match({path: 'src/app.js', moduleId: 'app'}));
  t.notOk(b.match({path: 'src/app1.js', moduleId: 'app1'}));
  t.end();
});

test('bundle supports minimatch pattern match', t => {
  const b = new Bundle({name: 'b', contain: 'src/app*.js'});
  t.ok(b.match({path: 'src/app.js', moduleId: 'app'}));
  t.ok(b.match({path: 'src/app1.js', moduleId: 'app1'}));
  t.end();
});

test('bundle supports regex pattern match', t => {
  const b = new Bundle({name: 'b', contain: /^src\/app\d?.js$/});
  t.ok(b.match({path: 'src/app.js', moduleId: 'app'}));
  t.ok(b.match({path: 'src/app1.js', moduleId: 'app1'}));
  t.notOk(b.match({path: 'src/app12.js', moduleId: 'app12'}));
  t.end();
});

test('bundle supports func pattern match', t => {
  const b = new Bundle({name: 'b', contain: (path, moduleId, packageName) => {
    return moduleId === 'yes' || packageName === 'yes';
  }});
  t.notOk(b.match({path: 'src/app.js', moduleId: 'app'}));
  t.ok(b.match({path: 'src/app1.js', moduleId: 'yes'}));
  t.ok(b.match({path: 'src/app1.js', moduleId: 'app1', packageName: 'yes'}));
  t.notOk(b.match({path: 'src/app1.js', moduleId: 'app1'}));
  t.end();
});

test('bundle supports array of patterns', t => {
  const b = new Bundle({name: 'b', contain: [
    'src/app*.js',
    /^src\/bar\d?.js$/,
    (path, moduleId, packageName) => {
      return moduleId === 'yes' || packageName === 'yes';
    }
  ]});

  t.ok(b.match({path: 'src/app.js', moduleId: 'app'}));
  t.ok(b.match({path: 'src/app1.js', moduleId: 'app1'}));

  t.ok(b.match({path: 'src/bar.js', moduleId: 'bar'}));
  t.ok(b.match({path: 'src/bar1.js', moduleId: 'bar1'}));
  t.notOk(b.match({path: 'src/bar12.js', moduleId: 'bar12'}));

  t.notOk(b.match({path: 'src/foo.js', moduleId: 'foo'}));
  t.ok(b.match({path: 'src/foo1.js', moduleId: 'yes'}));
  t.ok(b.match({path: 'src/foo1.js', moduleId: 'foo1', packageName: 'yes'}));
  t.notOk(b.match({path: 'src/foo1.js', moduleId: 'foo1'}));
  t.end();
});
