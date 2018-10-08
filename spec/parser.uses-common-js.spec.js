'use strict';
import test from 'tape';
import {usesCommonJs} from '../src/parser';

// copied from r.js/build/tests/parse.js
// for usesCommonJs

test('usesCommonJs captures require("dep")', t => {
  t.deepEqual(usesCommonJs("var dep = require('dep');"), {require: true});
  t.end();
});

test('usesCommonJs captures exports.foo =', t => {
  t.deepEqual(usesCommonJs("something(); exports.foo = another();"), {exports: true});
  t.end();
});

test('usesCommonJs captures module.exports =', t => {
  t.deepEqual(usesCommonJs("(function () { module.exports = function () {}; }());"), {moduleExports: true});
  t.end();
});

test('usesCommonJs captures require("dep") and exports.foo =', t => {
  t.deepEqual(usesCommonJs("var a = require('a'); something(); exports.b = a;"), {require: true, exports: true});
  t.end();
});

test('usesCommonJs captures exports.foo = and __dirname', t => {
  t.deepEqual(usesCommonJs("exports.foo = function () { return something(__dirname); };"), {exports: true, dirname: true});
  t.end();
});

test('usesCommonJs captures __filename', t => {
  t.deepEqual(usesCommonJs("var foo = 'bar', path = __filename;"), {filename: true});
  t.end();
});

test('usesCommonJs captures module.exports.exec =', t => {
  t.deepEqual(usesCommonJs("module.exports.exec = function() {}"), {moduleExports: true});
  t.end();
});

test('usesCommonJs ignores amd', t => {
  t.equal(usesCommonJs(
    "(function(){ if (typeof define === 'function' && define.amd) { define(['some'], function (some) {}) } }());"
  ), undefined);
  t.end();
});

test('usesCommonJs ignores amd require([deps]', t => {
  t.equal(usesCommonJs("require(['something']);"), undefined);
  t.end();
});

test('usesCommonJs ignores local exports', t => {
  t.equal(usesCommonJs("var exports; exports.foo = 'bar';"), undefined);
  t.end();
});

test('usesCommonJs ignores local exports case2', t => {
  t.equal(usesCommonJs("var exports = {}; exports.foo = 'bar';"), undefined);
  t.end();
});

test('usesCommonJs only ignores local exports after seeing it', t => {
  t.deepEqual(usesCommonJs("require('a'); exports.foo = 1; function t() {var exports; exports.foo = 'bar';}"),
    {require: true, exports: true});
  t.end();
});

test('usesCommonJs ignores local exports assignment', t => {
  t.equal(usesCommonJs("var exports = function () {};"), undefined);
  t.end();
});

// https://github.com/requirejs/r.js/issues/980
test('usesCommonJs captures exports.foo = in inner expression', t => {
  t.deepEqual(usesCommonJs("LogLevel = exports.LogLevel || (exports.LogLevel = {})"), {exports: true});
  t.end();
});

// original r.js parse cannot cover this.
// we can, because of scope analysis.
test('usesCommonJs ignores local exports only in scope', t => {
  t.deepEqual(usesCommonJs("const t = () => {let exports; exports.foo = 'bar';};\nexports.bar = 1;"), {exports: true});
  t.end();
});

test('usesCommonJs understands amdefine', t => {
  t.deepEqual(usesCommonJs("if (typeof define !== 'function') { var define = require('amdefine')(module); }\ndefine(function(require) {})"), {require: true, moduleExports: true});
  t.end();
});

test('usesCommonJs ignores es2015 module', t => {
  t.equal(usesCommonJs("export const foo = 'bar';"), undefined);
  t.end();
});
