const {usesEsm} = require('../parser');
const {parseUnit} = require('./parse-unit');
const {stripSourceMappingUrl} = require('../shared');
const ts = require('typescript');

// wrap esm into cjs if needed
module.exports = function esmToCjs(unit) {
  let parsed = parseUnit(unit);

  if (usesEsm(parsed)) {
    const filename = unit.sourceMap && unit.sourceMap.file || unit.path;
    const cjs = ts.transpileModule(unit.contents, {
      compilerOptions: {
        target: ts.ScriptTarget.Latest,
        module: ts.ModuleKind.CommonJS,
        declaration: false,
        noImplicitAny: false,
        noResolve: true,
        removeComments: true,
        sourceMap: true,
        esModuleInterop: true,
        importHelpers: true,
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
        preserveValueImports: true
      }
    });

    const map = JSON.parse(cjs.sourceMapText);
    map.file = filename;
    map.sources = [filename];
    // typescript compile sometimes use \r\n in browser environment??
    const code = stripSourceMappingUrl(cjs.outputText.replace(/\r\n/g, '\n'));

    return {
      contents: code,
      sourceMap: map,
      forceWrap: true // force cjs wrap in later stage
    };
  }

  // nil transform, reuse parsed
  return {parsed};
};
