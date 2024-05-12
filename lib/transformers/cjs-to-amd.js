const {globalIndentifiers, usesCommonJs, usesAmdOrRequireJs} = require('../parser');
const {traverse} = require('ast-matcher');
const {parseUnit} = require('./parse-unit');
const modifyCode = require('modify-code').default;

// wrap cjs into amd if needed
module.exports = function cjsToAmd(unit) {
  const {contents, path, packageName, sourceMap, shim} = unit;
  let parsed = parseUnit(unit);
  let globalIds = globalIndentifiers(parsed);

  let cjsUsage = usesCommonJs(parsed, globalIds);
  let amdUsage = usesAmdOrRequireJs(parsed, globalIds);
  let {forceWrap} = unit;

  if (
    !forceWrap && !shim &&
    (
      (packageName && path.match(/\/(cjs|commonjs)\//i)) ||
      // Treat empty code as commonjs code.
      parsed.body.length === 0
    )
  ) {
    // skip analysis and force a cjs to amd wrap.
    forceWrap = true;
  }

  if (!forceWrap && ((amdUsage && amdUsage.define) || !cjsUsage)) {
    // skip wrapping for amd/umd code
    return {parsed};
  }

  const filename = sourceMap && sourceMap.file || path;
  const m = modifyCode(contents, filename);
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
  let hasLocalDynamicImport = false;

  traverse(parsed, node => {
    if (node.type === 'Import' || node.type === 'ImportExpression') {
      // ignore following imports:
      //   import('https://domain.name/path')
      //   import('http://domain.name/path')
      //   import('//domain.name/path')
      //   import('/path/from/root')
      // let browser handle them.
      if ((node.source.type === 'Literal' || node.source.type === 'StringLiteral') && node.source.value.match(/^(?:https?:)?\//)) {
        return;
      }
      hasLocalDynamicImport = true;
      m.replace(node.start, node.start + 6, 'imp0r_');
    }
  });

  if (hasLocalDynamicImport) {
    m.prepend("var imp0r_ = function(d){return requirejs([requirejs.resolveModuleId(module.id,d)]).then(function(r){return r[0];});};");
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
