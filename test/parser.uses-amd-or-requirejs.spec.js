const test = require('tape');
const {usesAmdOrRequireJs} = require('../lib/parser');

// copied from r.js/build/tests/parse.js
// for usesAmdOrRequireJs

test('usesAmdOrRequireJs catpures define', t => {
  t.deepEqual(
    usesAmdOrRequireJs("(function(){ if (typeof define === 'function' && define.amd) { define(['some'], function (some) {}) } }());"),
    {define: true}
  );
  t.end();
});

test('usesAmdOrRequireJs catpures define case2', t => {
  t.deepEqual(
    usesAmdOrRequireJs("(function(){ if (typeof define === 'function' && define.amd) { define(definition); } }());"),
    {define: true}
  );
  t.end();
});

test('usesAmdOrRequireJs catpures amd require with opts', t => {
  t.deepEqual(
    usesAmdOrRequireJs("require({ baseUrl: 'scripts' }, ['main']);"),
    {require: ['main']}
  );
  t.end();
});

test('usesAmdOrRequireJs catpures amd requirejs with opts', t => {
  t.deepEqual(
    usesAmdOrRequireJs("requirejs({ baseUrl: 'scripts' }, ['main']);"),
    {requirejs: ['main']}
  );
  t.end();
});

test('usesAmdOrRequireJs catpures require.config', t => {
  t.deepEqual(
    usesAmdOrRequireJs("require.config({ baseUrl: 'scripts' });"),
    {requireConfig: true}
  );
  t.end();
});

test('usesAmdOrRequireJs catpures amd require', t => {
  t.deepEqual(
    usesAmdOrRequireJs("require(['something']);"),
    {require: ['something']}
  );
  t.end();
});

test('usesAmdOrRequireJs catpures amd require with callback', t => {
  t.deepEqual(
    usesAmdOrRequireJs("require(['something'], function (s) {});"),
    {require: ['something']}
  );
  t.end();
});

test('usesAmdOrRequireJs catpures requirejs', t => {
  t.deepEqual(
    usesAmdOrRequireJs("requirejs(['something']);"),
    {requirejs: ['something']}
  );
  t.end();
});

test('usesAmdOrRequireJs catpures requirejs with callback', t => {
  t.deepEqual(
    usesAmdOrRequireJs("requirejs(['something'], function (s) {});"),
    {requirejs: ['something']}
  );
  t.end();
});

test('usesAmdOrRequireJs catpures define with es6 arrow func and cjs wrapper', t => {
  t.deepEqual(
    usesAmdOrRequireJs("define((require, exports, module) => { module.exports = { name: 'b', uri: module.uri, c: require('c') }; });"),
    {define: true}
  );
  t.end();
});

// in addition, check behind function scope
test('usesAmdOrRequireJs catpures amd require with es6 arrow func, behind function scope', t => {
  t.deepEqual(
    usesAmdOrRequireJs("(() => require(['a'], (a) => { console.log(a); }))()"),
    {require: ['a']}
  );
  t.end();
});

test('usesAmdOrRequireJs ignores cjs require', t => {
  t.equal(usesAmdOrRequireJs("var dep = require('dep');"), undefined);
  t.end();
});

test('usesAmdOrRequireJs ignores non-global define', t => {
  t.equal(usesAmdOrRequireJs("this.define('some', 'thing');"), undefined);
  t.end();
});

test('usesAmdOrRequireJs ignores local definition of define', t => {
  t.equal(usesAmdOrRequireJs("var obj = { define: function () {} };"), undefined);
  t.end();
});

test('usesAmdOrRequireJs understands amdefine', t => {
  t.deepEqual(usesAmdOrRequireJs("if (typeof define !== 'function') { var define = require('amdefine')(module); }\ndefine(function(require) {})"), {define: true});
  t.end();
});

test('usesAmdOrRequireJs ignores es2015 module', t => {
  t.equal(usesAmdOrRequireJs("export const foo = 'bar';"), undefined);
  t.end();
});

// declaresDefine and defineAmd are not implemented.
/*
function parseUsesAmdOrRequireJs(t) {

      //Some tests from uglifyjs, which has a local define.
      bad4 = "(function() {define(name, 'whatever'); function define() { } }());",
      bad5 = "(function() {define(name, 'whatever'); function define() { } define.amd = {} }());",
      result;

  result = parse.usesAmdOrRequireJs("bad4", bad4);
  t.is(true, result.define);
  t.is(true, result.declaresDefine);
  t.is(false, !!result.defineAmd);

  result = parse.usesAmdOrRequireJs("bad5", bad5);
  t.is(true, result.define);
  t.is(true, result.declaresDefine);
  t.is(true, result.defineAmd);
}
*/