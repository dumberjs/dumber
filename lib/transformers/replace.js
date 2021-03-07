// replace transform on every npm package

// browser replacement
// https://github.com/defunctzombie/package-browser-field-spec
// see package-reader.js for more details
//
// also dep string cleanup
// remove tailing '/', '.js'
const {parseUnit} = require('./parse-unit');
const astMatcher = require('ast-matcher');
require('../ensure-parser-set')();
const modifyCode = require('modify-code').default;

const amdDep = astMatcher('define([__anl_deps], __any)');
const namedAmdDep = astMatcher('define(__str, [__anl_deps], __any)');
const cjsDep = astMatcher('require(__any_dep)');
const isUMD = astMatcher('typeof define === "function" && define.amd');
const isUMD2 = astMatcher('typeof define == "function" && define.amd');

module.exports = function replace(unit) {
  const {contents, replacement, sourceMap, path} = unit;
  const parsed = parseUnit(unit);

  if (isUMD(parsed) || isUMD2(parsed)) {
    // Skip lib in umd format, because browersify umd build could
    // use require('./file.js') which we should not strip .js
    return {parsed};
  }

  const filename = sourceMap && sourceMap.file || path;
  const m = modifyCode(contents, filename);
  let isChanged = false;

  const _find = node => {
    if (node.type !== 'Literal') return;
    let dep = node.value;

    // remove tailing '/'
    if (dep.endsWith('/')) {
      dep = dep.slice(0, -1);
    }

    // browser replacement;
    if (replacement && replacement[dep]) {
      dep = replacement[dep];
    }

    if (node.value !== dep) {
      isChanged = true;
      m.replace(
        node.start,
        node.end,
        `'${dep}'`
      );
    }
  };

  const amdMatch = amdDep(parsed);
  if (amdMatch) {
    amdMatch.forEach(result => {
      result.match.deps.forEach(_find);
    });
  }

  const namedAmdMatch = namedAmdDep(parsed);
  if (namedAmdMatch) {
    namedAmdMatch.forEach(result => {
      result.match.deps.forEach(_find);
    });
  }

  const cjsMatch = cjsDep(parsed);
  if (cjsMatch) {
    cjsMatch.forEach(result => {
      _find(result.match.dep);
    });
  }

  // esm format is normalized by ./esm-to-cjs.js
  // don't need to deal with esm here

  if (isChanged) {
    const result = m.transform();
    return {
      contents: result.code,
      sourceMap: result.map
    }
  }
  // not changed
  return {parsed};
};
