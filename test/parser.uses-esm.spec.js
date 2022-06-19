'use strict';
const {test} = require('zora');
const {usesEsm} = require('../lib/parser');

test('usesEsm ignores commonjs', t => {
  t.equal(usesEsm("var dep = require('dep');"), false);
});

test('usesEsm ignores amd', t => {
  t.equal(usesEsm("define(['a'], function(a) {return a;});"), false);
});

test('usesEsm captures import', t => {
  t.equal(usesEsm("import _ from 'lodash';"), true);
  t.equal(usesEsm("import '@babel/polyfill';"), true);
});

test('usesEsm captures export', t => {
  t.equal(usesEsm("export default class A {}"), true);
  t.equal(usesEsm("export const foo = 1;"), true);
  t.equal(usesEsm("export * from 'lodash';"), true);
  t.equal(usesEsm("const foo = 1; export {foo};"), true);
});
