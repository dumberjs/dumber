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
    packageMainPath: 'dist/index.js',
    moduleId: 'foo/dist/lo',
    defined: []
  }));
  t.notOk(conventionalAlias({
    packageName: 'foo',
    packageMainPath: 'dist/index.js',
    moduleId: 'foo/dist/lo',
    defined: ['m', 'n']
  }));
  t.end();
});

test('conventionalAlias does not create alias if main does not have same prefix', t => {
  t.notOk(conventionalAlias({
    packageName: 'foo',
    packageMainPath: 'index.js',
    moduleId: 'foo/dist/lo',
    defined: ['foo/dist/lo']
  }));

  t.notOk(conventionalAlias({
    packageName: 'foo',
    packageMainPath: 'index.js',
    moduleId: 'foo/dists/lo',
    defined: ['foo/dists/lo']
  }));

  t.notOk(conventionalAlias({
    packageName: 'foo',
    packageMainPath: 'index.js',
    moduleId: 'foo/output/lo',
    defined: ['foo/output/lo']
  }));

  t.notOk(conventionalAlias({
    packageName: 'foo',
    packageMainPath: 'index.js',
    moduleId: 'foo/out/lo',
    defined: ['foo/out/lo']
  }));

  t.notOk(conventionalAlias({
    packageName: 'foo',
    packageMainPath: 'index.js',
    moduleId: 'foo/lib/lo',
    defined: ['foo/lib/lo']
  }));

  t.notOk(conventionalAlias({
    packageName: 'foo',
    packageMainPath: 'index.js',
    moduleId: 'foo/libs/lo',
    defined: ['foo/libs/lo']
  }));
  t.end();
});

test('conventionalAlias shorten dist folder', t => {
  t.deepEqual(conventionalAlias({
    packageName: 'foo',
    packageMainPath: 'dist/index.js',
    moduleId: 'foo/dist/lo',
    defined: ['foo/dist/lo']
  }), {alias: 'foo/lo'});

  t.deepEqual(conventionalAlias({
    packageName: 'foo',
    packageMainPath: 'dists/index.js',
    moduleId: 'foo/dists/lo',
    defined: ['foo/dists/lo']
  }), {alias: 'foo/lo'});

  t.deepEqual(conventionalAlias({
    packageName: 'foo',
    packageMainPath: 'output/index.js',
    moduleId: 'foo/output/lo',
    defined: ['foo/output/lo']
  }), {alias: 'foo/lo'});

  t.deepEqual(conventionalAlias({
    packageName: 'foo',
    packageMainPath: 'out/index.js',
    moduleId: 'foo/out/lo',
    defined: ['foo/out/lo']
  }), {alias: 'foo/lo'});

  t.deepEqual(conventionalAlias({
    packageName: 'foo',
    packageMainPath: 'lib/index.js',
    moduleId: 'foo/lib/lo',
    defined: ['foo/lib/lo']
  }), {alias: 'foo/lo'});

  t.deepEqual(conventionalAlias({
    packageName: 'foo',
    packageMainPath: 'libs/index.js',
    moduleId: 'foo/libs/lo',
    defined: ['foo/libs/lo']
  }), {alias: 'foo/lo'});
  t.end();
});

test('conventionalAlias does not create alias if main does not have same prefix', t => {
  t.notOk(conventionalAlias({
    packageName: 'foo',
    packageMainPath: 'index.js',
    moduleId: 'foo/dist/amd/lo',
    defined: ['foo/dist/amd/lo']
  }));

  t.notOk(conventionalAlias({
    packageName: 'foo',
    packageMainPath: 'index.js',
    moduleId: 'foo/dist/umd/lo',
    defined: ['foo/dist/umd/lo']
  }));

  t.notOk(conventionalAlias({
    packageName: 'foo',
    packageMainPath: 'index.js',
    moduleId: 'foo/dists/cjs/lo',
    defined: ['foo/dists/cjs/lo']
  }));

  t.notOk(conventionalAlias({
    packageName: 'foo',
    packageMainPath: 'index.js',
    moduleId: 'foo/output/commonjs/lo',
    defined: ['foo/output/commonjs/lo']
  }));

  t.notOk(conventionalAlias({
    packageName: 'foo',
    packageMainPath: 'index.js',
    moduleId: 'foo/out/ES2015/lo',
    defined: ['foo/out/ES2015/lo']
  }));

  t.notOk(conventionalAlias({
    packageName: 'foo',
    packageMainPath: 'index.js',
    moduleId: 'foo/lib/CJS/lo',
    defined: ['foo/lib/CJS/lo']
  }));

  t.notOk(conventionalAlias({
    packageName: 'foo',
    packageMainPath: 'index.js',
    moduleId: 'foo/libs/native-modules/lo',
    defined: ['foo/libs/native-modules/lo']
  }));
  t.end();
});

test('conventionalAlias shorten dist+format folder', t => {
  t.deepEqual(conventionalAlias({
    packageName: 'foo',
    packageMainPath: 'dist/amd/index.js',
    moduleId: 'foo/dist/amd/lo',
    defined: ['foo/dist/amd/lo']
  }), {alias: 'foo/lo'});

  t.deepEqual(conventionalAlias({
    packageName: 'foo',
    packageMainPath: 'dist/umd/index.js',
    moduleId: 'foo/dist/umd/lo',
    defined: ['foo/dist/umd/lo']
  }), {alias: 'foo/lo'});

  t.deepEqual(conventionalAlias({
    packageName: 'foo',
    packageMainPath: 'dists/cjs/index.js',
    moduleId: 'foo/dists/cjs/lo',
    defined: ['foo/dists/cjs/lo']
  }), {alias: 'foo/lo'});

  t.deepEqual(conventionalAlias({
    packageName: 'foo',
    packageMainPath: 'output/index.js',
    moduleId: 'foo/output/commonjs/lo',
    defined: ['foo/output/commonjs/lo']
  }), {alias: 'foo/commonjs/lo'});

  t.deepEqual(conventionalAlias({
    packageName: 'foo',
    packageMainPath: 'out/ES2015/index.js',
    moduleId: 'foo/out/ES2015/lo',
    defined: ['foo/out/ES2015/lo']
  }), {alias: 'foo/lo'});

  t.deepEqual(conventionalAlias({
    packageName: 'foo',
    packageMainPath: 'lib/CJS/index.js',
    moduleId: 'foo/lib/CJS/lo',
    defined: ['foo/lib/CJS/lo']
  }), {alias: 'foo/lo'});

  t.deepEqual(conventionalAlias({
    packageName: 'foo',
    packageMainPath: 'libs/native-modules/index.js',
    moduleId: 'foo/libs/native-modules/lo',
    defined: ['foo/libs/native-modules/lo']
  }), {alias: 'foo/lo'});
  t.end();
});
