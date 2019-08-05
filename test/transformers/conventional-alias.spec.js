const test = require('tape');
const conventionalAlias = require('../../lib/transformers/conventional-alias');

test('conventionalAlias ignores resource did not follow the convention', t => {
  t.notOk(conventionalAlias({
    packageName: 'foo',
    moduleId: 'foo/bar/lo',
    defined: ['foo/bar/lo']
  }));
  t.end();
});

test('conventionalAlias ignores local file', t => {
  t.notOk(conventionalAlias({
    moduleId: 'local/dist/lo',
    defined: ['local/dist/lo']
  }));
  t.end();
});

test('conventionalAlias ignores unexpected module', t => {
  t.notOk(conventionalAlias({
    packageName: 'foo',
    moduleId: 'foo/dist/lo',
    defined: []
  }));
  t.notOk(conventionalAlias({
    packageName: 'foo',
    moduleId: 'foo/dist/lo',
    defined: ['m', 'n']
  }));
  t.end();
});

test('conventionalAlias shorten dist folder', t => {
  t.deepEqual(conventionalAlias({
    packageName: 'foo',
    moduleId: 'foo/dist/lo',
    defined: ['foo/dist/lo']
  }), {alias: 'foo/lo'});

  t.deepEqual(conventionalAlias({
    packageName: 'foo',
    moduleId: 'foo/dists/lo',
    defined: ['foo/dists/lo']
  }), {alias: 'foo/lo'});

  t.deepEqual(conventionalAlias({
    packageName: 'foo',
    moduleId: 'foo/output/lo',
    defined: ['foo/output/lo']
  }), {alias: 'foo/lo'});

  t.deepEqual(conventionalAlias({
    packageName: 'foo',
    moduleId: 'foo/out/lo',
    defined: ['foo/out/lo']
  }), {alias: 'foo/lo'});

  t.deepEqual(conventionalAlias({
    packageName: 'foo',
    moduleId: 'foo/lib/lo',
    defined: ['foo/lib/lo']
  }), {alias: 'foo/lo'});

  t.deepEqual(conventionalAlias({
    packageName: 'foo',
    moduleId: 'foo/libs/lo',
    defined: ['foo/libs/lo']
  }), {alias: 'foo/lo'});
  t.end();
});

test('conventionalAlias shorten dist+format folder', t => {
  t.deepEqual(conventionalAlias({
    packageName: 'foo',
    moduleId: 'foo/dist/amd/lo',
    defined: ['foo/dist/amd/lo']
  }), {alias: 'foo/lo'});

  t.deepEqual(conventionalAlias({
    packageName: 'foo',
    moduleId: 'foo/dist/umd/lo',
    defined: ['foo/dist/umd/lo']
  }), {alias: 'foo/lo'});

  t.deepEqual(conventionalAlias({
    packageName: 'foo',
    moduleId: 'foo/dists/cjs/lo',
    defined: ['foo/dists/cjs/lo']
  }), {alias: 'foo/lo'});

  t.deepEqual(conventionalAlias({
    packageName: 'foo',
    moduleId: 'foo/output/commonjs/lo',
    defined: ['foo/output/commonjs/lo']
  }), {alias: 'foo/lo'});

  t.deepEqual(conventionalAlias({
    packageName: 'foo',
    moduleId: 'foo/out/ES2015/lo',
    defined: ['foo/out/ES2015/lo']
  }), {alias: 'foo/lo'});

  t.deepEqual(conventionalAlias({
    packageName: 'foo',
    moduleId: 'foo/lib/CJS/lo',
    defined: ['foo/lib/CJS/lo']
  }), {alias: 'foo/lo'});

  t.deepEqual(conventionalAlias({
    packageName: 'foo',
    moduleId: 'foo/libs/native-modules/lo',
    defined: ['foo/libs/native-modules/lo']
  }), {alias: 'foo/lo'});
  t.end();
});