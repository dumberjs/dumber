'use strict';
const astMatcher = require('ast-matcher');
const ensureParsed = astMatcher.ensureParsed;
const compilePattern = astMatcher.compilePattern;
const extract = astMatcher.extract;
const traverse = astMatcher.traverse;
const STOP = astMatcher.STOP;
// const SKIP_BRANCH = astMatcher.SKIP_BRANCH;

const cjsUsages = {
  'require': [compilePattern('require(__str)')],
  'exports': [compilePattern('exports.__any = __any')],
  'moduleExports': [
    compilePattern('module.exports = __any'),
    compilePattern('module.exports.__any = __any')
  ],
  'dirname': [compilePattern('__dirname')],
  'filename': [compilePattern('__filename')],
  // The way we deal with 'var exports' is naive, we ignore
  // everything after seeing 'var exports'.
  // The correct way is to track the scope of the variable,
  // and only ignores 'exports' within that scope.
  'varExports': [
    compilePattern('var exports'),
    compilePattern('var exports = __any')
  ]
}

exports.usesCommonJs = function(code) {
  let node = ensureParsed(code);
  let keys = Object.keys(cjsUsages);
  let keysLen = keys.length;
  let usage = {};

  // directly use extract() instead of astMatcher()
  // for efficiency
  traverse(node, function (n) {
    for (let k = 0; k < keysLen; k += 1) {
      let key = keys[k];

      if (!usage[key]) {
        let patterns = cjsUsages[key];
        let len = patterns.length;

        for (let i = 0; i < len; i += 1) {
          let result = extract(patterns[i], n);
          if (result) {
            usage[key] = true;
            if (key === 'varExports') return STOP;
            return;
          }
        }
      }
    }
  });

  delete usage.varExports;
  if (Object.keys(usage).length) {
    return usage;
  }
};

