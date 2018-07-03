import {globalIndentifiers, usesCommonJs, usesAmdOrRequireJs} from '../parser';
import astMatcher from 'ast-matcher';
const ensureParsed = astMatcher.ensureParsed;

// wrap cjs into amd if needed
export default function (contents, forceWrap) {
  let ast = ensureParsed(contents);
  let globalIds = globalIndentifiers(ast);

  let cjsUsage = usesCommonJs(ast, globalIds);
  let amdUsage = usesAmdOrRequireJs(ast, globalIds);

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
}
