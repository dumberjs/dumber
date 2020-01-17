const {globalIndentifiers, usesCommonJs, usesAmdOrRequireJs} = require('../parser');
const {ensureParsed, traverse} = require('ast-matcher');
const modifyCode = require('modify-code').default;

// wrap cjs into amd if needed
module.exports = function cjsToAmd(unit) {
  const {contents, path, packageName, sourceMap} = unit;
  let ast = ensureParsed(contents);
  let globalIds = globalIndentifiers(ast);

  let cjsUsage = usesCommonJs(ast, globalIds);
  let amdUsage = usesAmdOrRequireJs(ast, globalIds);
  let {forceWrap} = unit;

  if (!forceWrap && packageName && path.match(/\/(cjs|commonjs)\//i)) {
    // skip analysis and force a cjs to amd wrap.
    forceWrap = true;
  }

  if (!forceWrap && ((amdUsage && amdUsage.define) || !cjsUsage)) {
    // skip wrapping for amd/umd code
    return;
  }

  const filename = sourceMap && sourceMap.file || path;
  const m = modifyCode(contents, filename, {noJsx: true, noTypeScript: true});
  m.prepend('define(function (require, exports, module) {');

  if (cjsUsage && (cjsUsage.dirname || cjsUsage.filename)) {
    m.prepend("var __filename = module.uri || '', __dirname = __filename.slice(0, __filename.lastIndexOf('/') + 1);");
  }

  if (cjsUsage && cjsUsage['global']) {
    m.prepend('var global = this;');
  }

  if (cjsUsage && cjsUsage['process']) {
    m.prepend("var process = require('process');");
  }

  if (cjsUsage && cjsUsage['Buffer']) {
    m.prepend("var Buffer = require('buffer').Buffer;");
  }

  // es6 dynamic import() call
  let hasDynamicImport = false;

  traverse(ast, node => {
    if (node.type === 'Import' || node.type === 'ImportExpression') {
      hasDynamicImport = true;
      m.replace(node.start, node.start + 6, 'imp0r_');
    }
  });

  if (hasDynamicImport) {
    m.prepend("var imp0r_ = function(d){return requirejs([requirejs.resolveModuleId(module.id,d)]).then(function(r){return r[0]&&r[0].default?r[0].default:r;});};");
  }

  m.prepend('\n');
  m.append('\n});\n');

  const result = m.transform();

  const newUnit = {
    contents: result.code,
    sourceMap: result.map
  };

  if (forceWrap) newUnit.forceWrap = true;
  return newUnit;
};
