const {test} = require('zora');
const shimAmd = require('../../lib/transformers/shim-amd');

test('shimAmd shims', t => {
  const shim = 'var Foo = "Foo";';
  const shimExpected = 'var Foo = "Foo";;\n' +
                       'define(\'shim\',[\'bar\'],(function (global) {\n' +
                       '  return function () {\n' +
                       '    return global.Foo;\n' +
                       '  };\n' +
                       '}(this)));\n';
  const unit = {
    contents: shim,
    moduleId: 'shim',
    shim: {deps: ['bar'], 'exports': 'Foo'},
    path: 'src/shim.js',
    defined: [],
    deps: []
  }
  const r = shimAmd(unit);
  t.deepEqual(r.defined, ['shim']);
  t.ok(r.shimed);
  t.deepEqual(r.deps, ['bar']);
  t.equal(r.contents, shimExpected);
  t.equal(r.sourceMap.file, 'src/shim.js');
});

test('shimAmd shims without deps', t => {
  const shim = 'var Foo = "Foo";';
  const shimExpected = 'var Foo = "Foo";;\n' +
                       'define(\'shim\',(function (global) {\n' +
                       '  return function () {\n' +
                       '    return global.Foo;\n' +
                       '  };\n' +
                       '}(this)));\n';
  const unit = {
    contents: shim,
    moduleId: 'shim',
    shim: {'exports': 'Foo'},
    path: 'src/shim.js',
    defined: [],
    deps: []
  }
  const r = shimAmd(unit);
  t.deepEqual(r.defined, ['shim']);
  t.ok(r.shimed);
  t.deepEqual(r.deps, []);
  t.equal(r.contents, shimExpected);
  t.equal(r.sourceMap.file, 'src/shim.js');
});

test('shimAmd shims without exports', t => {
  const shim = 'var Foo = "Foo";';
  const shimExpected = 'var Foo = "Foo";;\n' +
                       'define(\'shim\',[\'bar\'],function(){});\n';
  const unit = {
    contents: shim,
    moduleId: 'shim',
    shim: {deps: ['bar']},
    path: 'src/shim.js',
    defined: [],
    deps: [],
    sourceMap: {
      version: 3,
      file: 'shim.js',
      sources: ['shim.ts'],
      mappings: ''
    }
  }
  const r = shimAmd(unit);
  t.deepEqual(r.defined, ['shim']);
  t.ok(r.shimed);
  t.deepEqual(r.deps, ['bar']);
  t.equal(r.contents, shimExpected);
  t.equal(r.sourceMap.file, 'shim.js');
});

test('shimAmd wrapShim', t => {
  const shim = 'var Foo = "Foo";';
  const shimExpected = '(function(root) {\n' +
                       'define(\'shim\',[\'bar\'],function() {\n' +
                       '  return (function() {\n' +
                       'var Foo = "Foo";;\n' +
                       'return root.Foo = Foo;\n' +
                       '  }).apply(root, arguments);\n' +
                       '});\n' +
                       '}(this));\n';

  const unit = {
    contents: shim,
    moduleId: 'shim',
    shim: {deps: ['bar'], 'exports': 'Foo', wrapShim: true},
    path: 'src/shim.js',
    defined: [],
    deps: []
  }
  const r = shimAmd(unit);
  t.deepEqual(r.defined, ['shim']);
  t.ok(r.shimed);
  t.deepEqual(r.deps, ['bar']);
  t.equal(r.contents, shimExpected);
  t.equal(r.sourceMap.file, 'src/shim.js');
});

test('shimAmd wrapShim without deps', t => {
  const shim = 'var Foo = "Foo";';
  const shimExpected = '(function(root) {\n' +
                       'define(\'shim\',function() {\n' +
                       '  return (function() {\n' +
                       'var Foo = "Foo";;\n' +
                       'return root.Foo = Foo;\n' +
                       '  }).apply(root, arguments);\n' +
                       '});\n' +
                       '}(this));\n';
  const unit = {
    contents: shim,
    moduleId: 'shim',
    shim: {'exports': 'Foo', wrapShim: true},
    path: 'src/shim.js',
    defined: [],
    deps: []
  }
  const r = shimAmd(unit);
  t.deepEqual(r.defined, ['shim']);
  t.ok(r.shimed);
  t.equal(r.deps.length, 0);
  t.equal(r.contents, shimExpected);
});

test('shimAmd wrapShim without exports', t => {
  const shim = 'var Foo = "Foo";';
  const shimExpected = '(function(root) {\n' +
                       'define(\'shim\',[\'bar\'],function() {\n' +
                       '  return (function() {\n' +
                       'var Foo = "Foo";;\n' +
                       '\n' +
                       '  }).apply(root, arguments);\n' +
                       '});\n' +
                       '}(this));\n';
  const unit = {
    contents: shim,
    moduleId: 'shim',
    shim: {deps: ['bar'], wrapShim: true},
    path: 'src/shim.js',
    defined: [],
    deps: []
  }
  const r = shimAmd(unit);
  t.deepEqual(r.defined, ['shim']);
  t.ok(r.shimed);
  t.deepEqual(r.deps, ['bar']);
  t.equal(r.contents, shimExpected);
});

test('shimAmd ignores shim settings if source code already defined amd module', t => {
  const good1 = 'if (typeof define === "function" && define.amd) {\n' +
                '    define(\'good/1\',definition);\n' +
                '}';

  const unit = {
    contents: good1,
    moduleId: 'shim',
    shim: {deps: ['bar'], 'exports': 'bar', wrapShim: true},
    path: 'src/shim.js',
    defined: ['good/1'],
    deps: []
  }
  const r = shimAmd(unit);
  t.notOk(r);
});

test('shimAmd add empty shim for non-amd module even when shim config is not provided', t => {
  const shim = 'var Foo = "Foo";';
  const shimExpected = 'var Foo = "Foo";;\n' +
                       'define(\'shim\',function(){});\n';
  const unit = {
    contents: shim,
    moduleId: 'shim',
    path: 'src/shim.js',
    defined: [],
    deps: []
  }
  const r = shimAmd(unit);
  t.deepEqual(r.defined, ['shim']);
  t.ok(r.shimed);
  t.deepEqual(r.deps, []);
  t.equal(r.contents, shimExpected);
  t.equal(r.sourceMap.file, 'src/shim.js');
});
