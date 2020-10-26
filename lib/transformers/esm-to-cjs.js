const {usesEsm} = require('../parser');
const {parseUnit} = require('./parse-unit');
const {transform} = require('@babel/core');
const transformCjs = require('@babel/plugin-transform-modules-commonjs');
const syntaxDynamicImport = require('@babel/plugin-syntax-dynamic-import');

// wrap esm into cjs if needed
module.exports = function esmToCjs(unit) {
  let parsed = parseUnit(unit);

  if (usesEsm(parsed)) {
    const filename = unit.sourceMap && unit.sourceMap.file || unit.path;
    const cjs = transform(unit.contents, {
      babelrc: false,
      configFile: false,
      sourceMaps: true,
      sourceFileName: filename,
      plugins: [[transformCjs, {"loose": true}], syntaxDynamicImport]
    });

    // fillup file name
    if (!cjs.map.file) cjs.map.file = filename;

    return {
      contents: cjs.code,
      sourceMap: cjs.map,
      forceWrap: true // force cjs wrap in later stage
    };
  }

  // nil transform, reuse parsed
  return {parsed};
};
