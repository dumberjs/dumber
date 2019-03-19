import test from 'tape';
import cjs from '../../src/transformers/cjs-to-amd';

// copied from r.js/build/tests/convert.js
// for commonJs.convert

test('cjs transform ignores amd code', t => {
  const unit = {
    contents: 'define("fake", {lol: "you guise"});',
    path: 'src/foo.js',
    moduleId: 'foo'
  };
  t.notOk(cjs(unit));
  t.end();
});

test('cjs transform ignores amd code case 2', t => {
  const unit = {
    contents: 'define("fake", [],\nfunction(){\nreturn{lol : \'you guise\'};\n});',
    path: 'src/foo.js',
    moduleId: 'foo'
  };
  t.notOk(cjs(unit));
  t.end();
});

test('cjs transform does not ignore amd code with requirejs usage', t => {
  const unit = {
    contents: "module.exports = requirejs(['foo']);",
    path: 'src/foo.js',
    moduleId: 'foo'
  };
  const newUnit = cjs(unit);
  t.equal(newUnit.contents, 'define(function (require, exports, module) {\nmodule.exports = requirejs([\'foo\']);\n});\n');
  t.deepEqual(newUnit.sourceMap.sources, ['src/foo.js']);
  t.equal(newUnit.sourceMap.file, 'src/foo.js');
  t.ok(newUnit.sourceMap.mappings);
  t.equal(newUnit.sourceMap.sourcesContent[0], unit.contents);
  t.notOk(newUnit.forceWrap);
  t.end();
});

test('cjs transform wraps cjs code', t => {
  const unit = {
    contents: 'exports.name = "foo";',
    path: 'src/foo.js',
    moduleId: 'foo'
  };
  const newUnit = cjs(unit);
  t.equal(newUnit.contents, 'define(function (require, exports, module) {\nexports.name = "foo";\n});\n');
  t.deepEqual(newUnit.sourceMap.sources, ['src/foo.js']);
  t.equal(newUnit.sourceMap.file, 'src/foo.js');
  t.ok(newUnit.sourceMap.mappings);
  t.equal(newUnit.sourceMap.sourcesContent[0], unit.contents);
  t.notOk(newUnit.forceWrap);
  t.end();
});

test('cjs transform wraps cjs code, uses file name on existing source map', t => {
  const unit = {
    contents: 'exports.name = "foo";',
    path: 'src/foo.js',
    moduleId: 'foo',
    sourceMap: {
      version: 3,
      file: 'foo.js',
      sources: ['foo.js'],
      mappping: ''
    }
  };
  const newUnit = cjs(unit);
  t.equal(newUnit.contents, 'define(function (require, exports, module) {\nexports.name = "foo";\n});\n');
  t.deepEqual(newUnit.sourceMap.sources, ['foo.js']);
  t.equal(newUnit.sourceMap.file, 'foo.js');
  t.ok(newUnit.sourceMap.mappings);
  t.equal(newUnit.sourceMap.sourcesContent[0], unit.contents);
  t.notOk(newUnit.forceWrap);
  t.end();
});

test('cjs transform wraps cjs code case 2', t => {
  const unit = {
    contents: 'module.exports = "foo";',
    path: 'src/foo.js',
    moduleId: 'foo'
  };
  const newUnit = cjs(unit);
  t.equal(newUnit.contents, 'define(function (require, exports, module) {\nmodule.exports = "foo";\n});\n');
  t.deepEqual(newUnit.sourceMap.sources, ['src/foo.js']);
  t.equal(newUnit.sourceMap.file, 'src/foo.js');
  t.ok(newUnit.sourceMap.mappings);
  t.equal(newUnit.sourceMap.sourcesContent[0], unit.contents);
  t.notOk(newUnit.forceWrap);
  t.end();
});

test('cjs transform wraps cjs code with require call', t => {
  const unit = {
    contents: 'var a = require("a");\nexports.name = a;',
    path: 'src/foo.js',
    moduleId: 'foo'
  };
  const newUnit = cjs(unit);
  t.equal(newUnit.contents, 'define(function (require, exports, module) {\nvar a = require("a");\nexports.name = a;\n});\n');
  t.deepEqual(newUnit.sourceMap.sources, ['src/foo.js']);
  t.equal(newUnit.sourceMap.file, 'src/foo.js');
  t.ok(newUnit.sourceMap.mappings);
  t.equal(newUnit.sourceMap.sourcesContent[0], unit.contents);
  t.notOk(newUnit.forceWrap);
  t.end();
});

test('cjs transform wraps cjs code with __dirname', t => {
  const unit = {
    contents: 'exports.name = __dirname;',
    path: 'src/foo.js',
    moduleId: 'foo'
  };
  const newUnit = cjs(unit);
  t.equal(newUnit.contents, 'define(function (require, exports, module) {' +
    'var __filename = module.uri || \'\', __dirname = __filename.slice(0, __filename.lastIndexOf(\'/\') + 1);\n' +
    'exports.name = __dirname;\n});\n');
  t.deepEqual(newUnit.sourceMap.sources, ['src/foo.js']);
  t.equal(newUnit.sourceMap.file, 'src/foo.js');
  t.ok(newUnit.sourceMap.mappings);
  t.equal(newUnit.sourceMap.sourcesContent[0], unit.contents);
  t.notOk(newUnit.forceWrap);
  t.end();
});

test('cjs transform wraps cjs code with __filename', t => {
  const unit = {
    contents: 'exports.name = __filename;',
    path: 'src/foo.js',
    moduleId: 'foo'
  };
  const newUnit = cjs(unit);
  t.equal(newUnit.contents, 'define(function (require, exports, module) {' +
    'var __filename = module.uri || \'\', __dirname = __filename.slice(0, __filename.lastIndexOf(\'/\') + 1);\n' +
    'exports.name = __filename;\n});\n');
  t.deepEqual(newUnit.sourceMap.sources, ['src/foo.js']);
  t.equal(newUnit.sourceMap.file, 'src/foo.js');
  t.ok(newUnit.sourceMap.mappings);
  t.equal(newUnit.sourceMap.sourcesContent[0], unit.contents);
  t.notOk(newUnit.forceWrap);
  t.end();
});

test('cjs transform wraps cjs code case 3', t => {
  const unit = {
    contents: 'var MyModule = module.exports = "foo";',
    path: 'src/foo.js',
    moduleId: 'foo'
  };
  const newUnit = cjs(unit);
  t.equal(newUnit.contents, 'define(function (require, exports, module) {\nvar MyModule = module.exports = "foo";\n});\n');
  t.deepEqual(newUnit.sourceMap.sources, ['src/foo.js']);
  t.equal(newUnit.sourceMap.file, 'src/foo.js');
  t.ok(newUnit.sourceMap.mappings);
  t.equal(newUnit.sourceMap.sourcesContent[0], unit.contents);
  t.notOk(newUnit.forceWrap);
  t.end();
});

test('cjs transform wraps cjs code with global, process, and Buffer', t => {
  const unit = {
    contents: 'exports.name = global.bar;exports.loo = Buffer.from(process.cwd());',
    path: 'src/foo.js',
    moduleId: 'foo'
  };
  const newUnit = cjs(unit);
  t.equal(newUnit.contents, 'define(function (require, exports, module) {' +
    'var global = this;var process = require(\'process\');var Buffer = require(\'buffer\').Buffer;\n' +
    'exports.name = global.bar;exports.loo = Buffer.from(process.cwd());\n});\n');
  t.deepEqual(newUnit.sourceMap.sources, ['src/foo.js']);
  t.equal(newUnit.sourceMap.file, 'src/foo.js');
  t.ok(newUnit.sourceMap.mappings);
  t.equal(newUnit.sourceMap.sourcesContent[0], unit.contents);
  t.notOk(newUnit.forceWrap);
  t.end();
});

test('cjs forces cjs wrap', t => {
  const unit = {
    contents: '// empty cjs code',
    path: 'src/foo.js',
    moduleId: 'foo',
    forceWrap: true
  };
  const newUnit = cjs(unit);
  t.equal(newUnit.contents, 'define(function (require, exports, module) {\n' +
    '// empty cjs code' +
    '\n});\n');
  t.deepEqual(newUnit.sourceMap.sources, ['src/foo.js']);
  t.equal(newUnit.sourceMap.file, 'src/foo.js');
  t.ok(newUnit.sourceMap.mappings);
  t.equal(newUnit.sourceMap.sourcesContent[0], unit.contents);
  t.ok(newUnit.forceWrap);
  t.end();
});

test('cjs forces cjs wrap with npm package file path contains cjs', t => {
  const unit = {
    contents: '// empty cjs code',
    path: 'node_module/foo/dist/cjs/index.js',
    packageName: 'foo',
    moduleId: 'foo/dist/cjs/index'
  };
  const newUnit = cjs(unit);
  t.equal(newUnit.contents, 'define(function (require, exports, module) {\n' +
    '// empty cjs code' +
    '\n});\n');
  t.deepEqual(newUnit.sourceMap.sources, ['node_module/foo/dist/cjs/index.js']);
  t.equal(newUnit.sourceMap.file, 'node_module/foo/dist/cjs/index.js');
  t.ok(newUnit.sourceMap.mappings);
  t.equal(newUnit.sourceMap.sourcesContent[0], unit.contents);
  t.ok(newUnit.forceWrap);
  t.end();
});

test('cjs forces cjs wrap with npm package file path contains commonjs', t => {
  const unit = {
    contents: '// empty cjs code',
    path: 'node_module/foo/dist/commonjs/index.js',
    packageName: 'foo',
    moduleId: 'foo/dist/commonjs/index'
  };
  const newUnit = cjs(unit);
  t.equal(newUnit.contents, 'define(function (require, exports, module) {\n' +
    '// empty cjs code' +
    '\n});\n');
  t.deepEqual(newUnit.sourceMap.sources, ['node_module/foo/dist/commonjs/index.js']);
  t.equal(newUnit.sourceMap.file, 'node_module/foo/dist/commonjs/index.js');
  t.ok(newUnit.sourceMap.mappings);
  t.equal(newUnit.sourceMap.sourcesContent[0], unit.contents);
  t.ok(newUnit.forceWrap);
  t.end();
});

test('cjs supports dynamic import() in ES module', t => {
  const unit = {
    contents: "exports.default = import('./a');",
    path: 'src/foo.js',
    moduleId: 'foo'
  };
  const newUnit = cjs(unit);
  t.ok(newUnit.contents.startsWith('define(function (require, exports, module) {' +
                                  'var imp0r_ = function(d){return requirejs([requirejs.resolveModuleId(module.id,d)]).then(function(r){return r[0]&&r[0].default?r[0].default:r;});};\n'));
  t.ok(newUnit.contents.includes("imp0r_('./a')"))
  t.end();
});
