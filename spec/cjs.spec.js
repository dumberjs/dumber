'use strict';
const test = require('tape');
const cjs = require('../lib/cjs');

// copied from r.js/build/tests/convert.js
// for commonJs.convert

test('cjs transform ignores amd code', t => {
  const source = 'define("fake", {lol: "you guise"});';
  t.equal(cjs(source), source);
  t.end();
});

test('cjs transform ignores amd code case 2', t => {
  const source = 'define("fake", [],\nfunction(){\nreturn{lol : \'you guise\'};\n});';
  t.equal(cjs(source), source);
  t.end();
});

test('cjs transform wraps cjs code', t => {
  const source = 'exports.name = "foo";';
  const expected = 'define(function (require, exports, module) {exports.name = "foo";\n});\n';

  t.equal(cjs(source), expected);
  t.end();
});

test('cjs transform wraps cjs code case 2', t => {
  const source = 'module.exports = "foo";';
  const expected = 'define(function (require, exports, module) {module.exports = "foo";\n});\n';

  t.equal(cjs(source), expected);
  t.end();
});

test('cjs transform wraps cjs code with require call', t => {
  const source = 'var a = require("a");\nexports.name = a;';
  const expected = 'define(function (require, exports, module) {var a = require("a");\nexports.name = a;\n});\n';

  t.equal(cjs(source), expected);
  t.end();
});

test('cjs transform wraps cjs code with __dirname', t => {
  const source = 'exports.name = __dirname;';
  const expected = 'define(function (require, exports, module) {' +
                   'var __filename = module.uri || \'\', __dirname = __filename.substring(0, __filename.lastIndexOf(\'/\') + 1); ' +
                   'exports.name = __dirname;\n});\n';

  t.equal(cjs(source), expected);
  t.end();
});

test('cjs transform wraps cjs code with __filename', t => {
  const source = 'exports.name = __filename;';
  const expected = 'define(function (require, exports, module) {' +
                   'var __filename = module.uri || \'\', __dirname = __filename.substring(0, __filename.lastIndexOf(\'/\') + 1); ' +
                   'exports.name = __filename;\n});\n';

  t.equal(cjs(source), expected);
  t.end();
});

test('cjs transform wraps cjs code case 3', t => {
  const source = 'var MyModule = module.exports = "foo";';
  const expected = 'define(function (require, exports, module) {var MyModule = module.exports = "foo";\n});\n';

  t.equal(cjs(source), expected);
  t.end();
});
