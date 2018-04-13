'use strict';
const test = require('tape');
const trace = require('../lib/trace');

test('trace rejects not-matching packageName and moduleId', t => {
  const unit = {
    path: 'node_module/foo/bar.js',
    contents: "lorem",
    moduleId: 'x/bar',
    packageName: 'foo'
  }
  t.throws(() => trace(unit));
  t.end();
});

test('trace traces js', t => {
  const unit = {
    path: 'src/foo/bar.js',
    contents: "define(['a','text!./b.css'],function() {});",
    moduleId: 'foo/bar'
  }

  const traced = trace(unit);
  t.deepEqual(traced, {
    path: 'src/foo/bar.js',
    contents: "define('foo/bar',['a','text!./b.css'],function() {});",
    sourceMap: undefined,
    moduleId: 'foo/bar',
    defined: 'foo/bar',
    deps: ['a', 'foo/b.css'],
    packageName: undefined,
    shim: undefined
  })
  t.end();
});

test('trace traces js and update sourceMap', t => {
  const unit = {
    path: 'src/foo/bar.js',
    contents: "exports.bar = require('./a');",
    sourceMap: {mappings: ";TEST;"},
    moduleId: 'foo/bar'
  }

  const traced = trace(unit);
  t.deepEqual(traced, {
    path: 'src/foo/bar.js',
    contents: "define('foo/bar',['require','exports','module','./a'],function (require, exports, module) {\n" +
              "exports.bar = require('./a');\n});\n",
    sourceMap: {mappings: ";;TEST;"},
    moduleId: 'foo/bar',
    defined: 'foo/bar',
    deps: ['foo/a'],
    packageName: undefined,
    shim: undefined
  })
  t.end();
});

test('trace traces shimed js and update sourceMap', t => {
  const unit = {
    path: 'node_modules/bar/bar.js',
    contents: "var Bar = 1;",
    sourceMap: {mappings: ";TEST;"},
    moduleId: 'bar/bar',
    packageName: 'bar',
    shim: { deps: ['foo'], 'exports': 'Bar', wrapShim: true}
  }

  const traced = trace(unit);
  t.deepEqual(traced, {
    path: 'node_modules/bar/bar.js',
    contents: '(function(root) {\n' +
              'define("bar/bar", [\'foo\'], function() {\n' +
              '  return (function() {\n' +
              'var Bar = 1;\n' +
              'return root.Bar = Bar;\n' +
              '  }).apply(root, arguments);\n});\n}(this));\n',
    sourceMap: {mappings: ";;;;TEST;"},
    moduleId: 'bar/bar',
    defined: 'bar/bar',
    deps: ['foo'],
    packageName: 'bar',
    shim: { deps: ['foo'], 'exports': 'Bar', wrapShim: true}
  })
  t.end();
});

test('trace transforms json', t => {
  const unit = {
    path: 'src/foo/bar.json',
    contents: '{"a":1}',
    moduleId: 'foo/bar.json'
  }

  const traced = trace(unit);
  t.deepEqual(traced, {
    path: 'src/foo/bar.json',
    contents: "define('text!foo/bar.json',function(){return \"{\\\"a\\\":1}\";});\n" +
              "define('foo/bar.json',['text!foo/bar.json'],function(m){return JSON.parse(m);});\n",
    sourceMap: undefined,
    moduleId: 'foo/bar.json',
    defined: ['text!foo/bar.json', 'foo/bar.json'],
    deps: [],
    packageName: undefined,
    shim: undefined
  })
  t.end();
});

test('trace transforms text file', t => {
  const unit = {
    path: 'src/foo/bar.html',
    contents: '<p></p>',
    moduleId: 'foo/bar.html'
  }

  const traced = trace(unit);
  t.deepEqual(traced, {
    path: 'src/foo/bar.html',
    contents: "define('text!foo/bar.html',function(){return \"<p></p>\";});\n" +
              "define('foo/bar.html',['text!foo/bar.html'],function(m){return m;});\n",
    sourceMap: undefined,
    moduleId: 'foo/bar.html',
    defined: ['text!foo/bar.html', 'foo/bar.html'],
    deps: [],
    packageName: undefined,
    shim: undefined
  })
  t.end();
});

test('trace supports optional depsFinder', t => {
  const depsFinder = function (path, contents) {
    if (path.endsWith('.js')) return ['./x'];
    if (path.endsWith('.html')) {
      let m = contents.match(/<require from="(\w+)"><\/require>/i);
      if (m) return [m[1]];
      return [];
    }
    return [];
  }

  let traced = trace({
    path: 'src/foo/bar.js',
    contents: 'require("./b");',
    moduleId: 'foo/bar'
  }, depsFinder);

  t.deepEqual(traced.deps, ['foo/b', 'foo/x']);

  traced = trace({
    path: 'src/foo/bar.html',
    contents: '<require from="lorem"></require>',
    moduleId: 'foo/bar.html'
  }, depsFinder);

  t.deepEqual(traced.deps, ['lorem']);

  t.end();
});
