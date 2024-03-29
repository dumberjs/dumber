'use strict';
const {test} = require('zora');
const {usesCommonJs} = require('../lib/parser');

// copied from r.js/build/tests/parse.js
// for usesCommonJs

test('usesCommonJs captures require("dep")', t => {
  t.deepEqual(usesCommonJs("var dep = require('dep');"), {require: ['dep']});
});

test('usesCommonJs captures exports.foo =', t => {
  t.deepEqual(usesCommonJs("something(); exports.foo = another();"), {exports: true});
});

test('usesCommonJs captures module.exports =', t => {
  t.deepEqual(usesCommonJs("(function () { module.exports = function () {}; }());"), {moduleExports: true});
});

test('usesCommonJs captures require("dep") and exports.foo =', t => {
  t.deepEqual(usesCommonJs("var a = require('a'); something(); exports.b = a;"), {require: ['a'], exports: true});
});

test('usesCommonJs captures exports.foo = and __dirname', t => {
  t.deepEqual(usesCommonJs("exports.foo = function () { return something(__dirname); };"), {exports: true, dirname: true});
});

test('usesCommonJs captures __filename', t => {
  t.deepEqual(usesCommonJs("var foo = 'bar', path = __filename;"), {filename: true});
});

test('usesCommonJs captures module.exports.exec =', t => {
  t.deepEqual(usesCommonJs("module.exports.exec = function() {}"), {moduleExports: true});
});

test('usesCommonJs ignores amd', t => {
  t.equal(usesCommonJs(
    "(function(){ if (typeof define === 'function' && define.amd) { define(['some'], function (some) {}) } }());"
  ), undefined);
});

test('usesCommonJs ignores amd require([deps]', t => {
  t.equal(usesCommonJs("require(['something']);"), undefined);
});

test('usesCommonJs ignores local exports', t => {
  t.equal(usesCommonJs("var exports; exports.foo = 'bar';"), undefined);
});

test('usesCommonJs ignores local exports case2', t => {
  t.equal(usesCommonJs("var exports = {}; exports.foo = 'bar';"), undefined);
});

test('usesCommonJs only ignores local exports after seeing it', t => {
  t.deepEqual(usesCommonJs("require('a'); exports.foo = 1; function t() {var exports; exports.foo = 'bar';}"),
    {require: ['a'], exports: true});
});

test('usesCommonJs ignores local exports assignment', t => {
  t.equal(usesCommonJs("var exports = function () {};"), undefined);
});

// https://github.com/requirejs/r.js/issues/980
test('usesCommonJs captures exports.foo = in inner expression', t => {
  t.deepEqual(usesCommonJs("LogLevel = exports.LogLevel || (exports.LogLevel = {})"), {exports: true});
});

// original r.js parse cannot cover this.
// we can, because of scope analysis.
test('usesCommonJs ignores local exports only in scope', t => {
  t.deepEqual(usesCommonJs("const t = () => {let exports; exports.foo = 'bar';};\nexports.bar = 1;"), {exports: true});
});

test('usesCommonJs understands amdefine', t => {
  t.deepEqual(usesCommonJs("if (typeof define !== 'function') { var define = require('amdefine')(module); }\ndefine(function(require) {})"), {require: ['amdefine'], moduleExports: true});
});

test('usesCommonJs ignores es2015 module', t => {
  t.equal(usesCommonJs("export const foo = 'bar';"), undefined);
});

test('usesCommonJs does not fail on __defineSetter__', t => {
  // a sample from core-js
  const code = `'use strict';
// Forced replacement prototype accessors methods
module.exports = require('./_library') || !require('./_fails')(function () {
  var K = Math.random();
  // In FF throws only define methods
  // eslint-disable-next-line no-undef, no-useless-call
  __defineSetter__.call(null, K, function () { /* empty */ });
  delete require('./_global')[K];
});`;
  t.deepEqual(usesCommonJs(code), {require: ['./_library', './_fails', './_global'], moduleExports: true});
});

test('usesCommonJs picks nodejs global, process, and Buffer', t => {
  t.deepEqual(usesCommonJs("if (global) { Buffer.from(process.cwd()); }"), {'global': true, 'Buffer': true, 'process': true});
});
