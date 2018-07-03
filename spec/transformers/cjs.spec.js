import test from 'tape';
import cjs from '../../src/transformers/cjs';

// copied from r.js/build/tests/convert.js
// for commonJs.convert

test('cjs transform ignores amd code', t => {
  const source = 'define("fake", {lol: "you guise"});';
  t.deepEqual(cjs(source), {contents: source});
  t.end();
});

test('cjs transform ignores amd code case 2', t => {
  const source = 'define("fake", [],\nfunction(){\nreturn{lol : \'you guise\'};\n});';
  t.deepEqual(cjs(source), {contents: source});
  t.end();
});

test('cjs transform wraps cjs code', t => {
  const source = 'exports.name = "foo";';
  const expected = 'define(function (require, exports, module) {\nexports.name = "foo";\n});\n';

  t.deepEqual(cjs(source), {headLines: 1, contents: expected});
  t.end();
});

test('cjs transform wraps cjs code case 2', t => {
  const source = 'module.exports = "foo";';
  const expected = 'define(function (require, exports, module) {\nmodule.exports = "foo";\n});\n';

  t.deepEqual(cjs(source), {headLines: 1, contents: expected});
  t.end();
});

test('cjs transform wraps cjs code with require call', t => {
  const source = 'var a = require("a");\nexports.name = a;';
  const expected = 'define(function (require, exports, module) {\nvar a = require("a");\nexports.name = a;\n});\n';

  t.deepEqual(cjs(source), {headLines: 1, contents: expected});
  t.end();
});

test('cjs transform wraps cjs code with __dirname', t => {
  const source = 'exports.name = __dirname;';
  const expected = 'define(function (require, exports, module) {' +
                   'var __filename = module.uri || \'\', __dirname = __filename.substring(0, __filename.lastIndexOf(\'/\') + 1);\n' +
                   'exports.name = __dirname;\n});\n';

  t.deepEqual(cjs(source), {headLines: 1, contents: expected});
  t.end();
});

test('cjs transform wraps cjs code with __filename', t => {
  const source = 'exports.name = __filename;';
  const expected = 'define(function (require, exports, module) {' +
                   'var __filename = module.uri || \'\', __dirname = __filename.substring(0, __filename.lastIndexOf(\'/\') + 1);\n' +
                   'exports.name = __filename;\n});\n';

  t.deepEqual(cjs(source), {headLines: 1, contents: expected});
  t.end();
});

test('cjs transform wraps cjs code case 3', t => {
  const source = 'var MyModule = module.exports = "foo";';
  const expected = 'define(function (require, exports, module) {\nvar MyModule = module.exports = "foo";\n});\n';

  t.deepEqual(cjs(source), {headLines: 1, contents: expected});
  t.end();
});
