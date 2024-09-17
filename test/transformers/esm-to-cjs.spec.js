const {test} = require('zora');
const esm = require('../../lib/transformers/esm-to-cjs');

test('esm skips non-ES module', t => {
  const unit = {
    contents: 'exports.foo = 1;',
    path: 'src/file.js',
    moduleId: 'file'
  };
  const newUnit = esm(unit);
  t.deepEqual(Object.keys(newUnit), ['parsed']);
  t.equal(newUnit.parsed.body[0].type, 'ExpressionStatement');
});

test('esm skips non-ES module', t => {
  const unit = {
    contents: 'define([], factory);',
    path: 'src/file.js',
    moduleId: 'file'
  };
  const newUnit = esm(unit);
  t.deepEqual(Object.keys(newUnit), ['parsed']);
  t.equal(newUnit.parsed.body[0].type, 'ExpressionStatement');
});

test('esm transforms wraps ES module', t => {
  const unit = {
    contents: 'export default process.cwd();',
    path: 'src/file.js',
    moduleId: 'file'
  };
  const newUnit = esm(unit);
  t.ok(newUnit.contents.includes('__esModule'));
  t.deepEqual(newUnit.sourceMap.sources, ['src/file.js']);
  t.equal(newUnit.sourceMap.file, 'src/file.js');
  t.ok(newUnit.sourceMap.mappings);
  t.ok(newUnit.forceWrap);
});

test('esm uses file name in existing sourcemap', t => {
  const unit = {
    contents: 'export default process.cwd();',
    path: 'src/file.js',
    moduleId: 'file',
    sourceMap: {
      version: 3,
      file: 'file.js',
      sources: ['file.js'],
      mappping: ''
    }
  };
  const newUnit = esm(unit);
  t.ok(newUnit.contents.includes('__esModule'));
  t.deepEqual(newUnit.sourceMap.sources, ['file.js']);
  t.equal(newUnit.sourceMap.file, 'file.js');
  t.ok(newUnit.sourceMap.mappings);
  t.ok(newUnit.forceWrap);
});

// Latest TypeScript does compile import() in to wrapped cjs require()
// test('esm supports dynamic import() in ES module', t => {
//   const unit = {
//     contents: 'export default import("./a");',
//     path: 'src/file.js',
//     moduleId: 'file'
//   };
//   const newUnit = esm(unit);
//   console.log('###' + newUnit.contents);
//   t.ok(newUnit.contents.includes('__esModule'));
//   t.ok(newUnit.contents.includes('import('));
//   t.deepEqual(newUnit.sourceMap.sources, ['src/file.js']);
//   t.equal(newUnit.sourceMap.file, 'src/file.js');
//   t.ok(newUnit.sourceMap.mappings);
//   t.ok(newUnit.forceWrap);
// });

test('esm does not transpile latest es syntax', t => {
  const unit = {
    contents: 'export async function* foo(a) { yield a?.b; }',
    path: 'src/file.js',
    moduleId: 'file'
  };
  const newUnit = esm(unit);
  t.equal(newUnit.contents, '"use strict";\nObject.defineProperty(exports, "__esModule", { value: true });\nexports.foo = foo;\nasync function* foo(a) { yield a?.b; }\n');
  t.deepEqual(newUnit.sourceMap.sources, ['src/file.js']);
  t.equal(newUnit.sourceMap.file, 'src/file.js');
  t.ok(newUnit.sourceMap.mappings);
  t.ok(newUnit.forceWrap);
})
