const test = require('tape');
const replace = require('../../lib/transformers/replace');

test('replace transform ignores empty replacement', t => {
  const source = `define('foo', ['require', 'module-a', './bar'], function (require) {
    require('module-a');
    require('./bar');
  })`;

  t.notOk(replace({
    contents: source,
    path: 'src/foo.js'
  }));
  t.end();
});

test('replace transform cleanup dep, even with empty replacement', t => {
  const source = `define('foo', ['require', 'module-a.js', './bar/', 'o/a.js'], function (require) {
    require('module-a.js');
    require('./bar/');
    require('o/a.js');
  })`;

  const result = `define('foo', ['require', 'module-a.js', './bar', 'o/a.js'], function (require) {
    require('module-a.js');
    require('./bar');
    require('o/a.js');
  })`;

  const unit = replace({
    contents: source,
    path: 'src/foo.js'
  });

  t.equal(unit.contents, result);
  t.equal(unit.sourceMap.file, 'src/foo.js');
  t.end();
});

test('replace transform does replacement', t => {
  const source = `define('foo', ['require', 'module-a', './bar', './server/only.js'], function (require) {
    require('module-a');
    require('./bar');
    require('./server/only.js');
  })`;

  const replacement = {
    'module-a': '__ignore__',
    'module-b': './shims/module/b',
    './server/only.js': './shims/client-only.js'
  }

  const result = `define('foo', ['require', '__ignore__', './bar', './shims/client-only.js'], function (require) {
    require('__ignore__');
    require('./bar');
    require('./shims/client-only.js');
  })`;

  const unit = replace({
    contents: source,
    path: 'src/foo.js',
    replacement
  });

  t.equal(unit.contents, result);
  t.end();
});

test('replace transform does replacement for anonymous amd module', t => {
  const source = `define(['require', 'module-a', './bar', './server/only.js'], function (require) {
    require('module-a');
    require('./bar');
    require('./server/only.js');
  })`;

  const replacement = {
    'module-a': '__ignore__',
    'module-b': './shims/module/b',
    './server/only.js': './shims/client-only.js'
  }

  const result = `define(['require', '__ignore__', './bar', './shims/client-only.js'], function (require) {
    require('__ignore__');
    require('./bar');
    require('./shims/client-only.js');
  })`;

  const unit = replace({
    contents: source,
    path: 'src/foo.js',
    replacement
  });

  t.equal(unit.contents, result);
  t.end();
});


test('replace transform skips cleanup for UMD build', t => {
  const umd = `(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.foo = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports = 'bar';

},{}],2:[function(require,module,exports){
module.exports = require('./bar.js');
},{"./bar.js":1}]},{},[2])(2)
});
`;

  t.notOk(replace({
    contents: umd,
    path: 'src/foo.js'
  }));
  t.end();
});

test('replace transform does replacement for npm file', t => {
  const unit = replace({
    path: 'node_modules/foo/lib/bar.js',
    contents: "require('module-a');require('module-b.js');require('module-c');require('../server/only.js');",
    moduleId: 'foo/lib/bar',
    packageName: 'foo',
    replacement: {
      'module-a': '__ignore__',
      'module-b.js': '../shims/module/b',
      '../server/only.js': '../shims/client-only.js'
    },
    sourceMap: {
      version: 3,
      file: 'foo/lib/bar.js',
      sources: ['foo/src/lib.ts'],
      mappings: ''
    }
  });

  t.equal(unit.contents, "require('__ignore__');require('../shims/module/b');require('module-c');require('../shims/client-only.js');")
  t.equal(unit.sourceMap.file, 'foo/lib/bar.js');
  t.deepEqual(unit.sourceMap.sources, ['foo/lib/bar.js']);
  t.end();
})
