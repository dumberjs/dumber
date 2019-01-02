import {globalIndentifiers, usesCommonJs, usesEsm, usesAmdOrRequireJs} from '../parser';
import {ensureParsed, traverse} from 'ast-matcher';
import {transform} from '@babel/core';
import transformCjs from '@babel/plugin-transform-modules-commonjs';
import syntaxDynamicImport from '@babel/plugin-syntax-dynamic-import';

// wrap cjs into amd if needed
export default function(contents, forceWrap) {
  let ast = ensureParsed(contents);

  if (usesEsm(ast)) {
    const cjs = transform(contents, {
      babelrc: false,
      sourceMaps: false,
      plugins: [[transformCjs, {"loose": true}], syntaxDynamicImport]
    });

    contents = cjs.code;
    ast = ensureParsed(contents);
    forceWrap = true;
  }

  let globalIds = globalIndentifiers(ast);

  let cjsUsage = usesCommonJs(ast, globalIds);
  let amdUsage = usesAmdOrRequireJs(ast, globalIds);

  if (!forceWrap && ((amdUsage && amdUsage.define) || !cjsUsage)) {
    // skip wrapping
    return { contents: contents };
  }

  let pre = '';
  if (cjsUsage && (cjsUsage.dirname || cjsUsage.filename)) {
    pre += 'var __filename = module.filename || \'\', ' +
          '__dirname = ' +
          '__filename.slice(0, __filename.lastIndexOf(\'/\') + 1);';
  }

  if (cjsUsage && cjsUsage['global']) {
    pre += 'var global = this;';
  }

  if (cjsUsage && cjsUsage['process']) {
    pre += "var process = require('process');";
  }

  if (cjsUsage && cjsUsage['Buffer']) {
    pre += "var Buffer = require('buffer').Buffer;";
  }

  // es6 dynamic import() call
  const toReplace = [];
  traverse(ast, node => {
    if (node.type === 'Import') {
      toReplace.push({
        start: node.start,
        end: node.end
      });
    }
  });

  if (toReplace.length) {
    // Use "imp0r_()" to replace "import()".
    // Note they have same length, so sourcemaps won't be affected.
    pre += "var imp0r_ = function(d){return requirejs([requirejs.resolveModuleId(module.id,d)]).then(function(r){return r[0]&&r[0].default?r[0].default:r;});};"
    // reverse sort by "start"
    toReplace.sort((a, b) => b.start - a.start).forEach(r => {
      contents = contents.slice(0, r.start) + 'imp0r_' + contents.slice(r.end);
    });
  }

  return {
    headLines: 1,
    contents: 'define(function (require, exports, module) {' + pre + '\n' +
               contents + '\n});\n'
  };
}
