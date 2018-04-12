/* eslint no-console: 0 */
// TODO need a logger implementation to remove usage of console
'use strict';
const parser = require('../parser');
const astMatcher = require('ast-matcher');
const ensureParsed = astMatcher.ensureParsed;

// wrap cjs into amd if needed
module.exports = function (contents, forceWrap) {
  let ast = ensureParsed(contents);
  let globalIds = parser.globalIndentifiers(ast);

  let cjsUsage = parser.usesCommonJs(ast, globalIds);
  let amdUsage = parser.usesAmdOrRequireJs(ast, globalIds);

  if (!forceWrap && (amdUsage || !cjsUsage)) {
    // skip wrapping
    return { contents: contents };
  }

  let pre = '';
  if (cjsUsage && (cjsUsage.dirname || cjsUsage.filename)) {
    pre = 'var __filename = module.uri || \'\', ' +
          '__dirname = ' +
          '__filename.substring(0, __filename.lastIndexOf(\'/\') + 1);';
  }

  return {
    headLines: 1,
    contents: 'define(function (require, exports, module) {' + pre + '\n' +
               contents + '\n});\n'
  };
};
