// replace transform on every npm package

// browser replacement
// https://github.com/defunctzombie/package-browser-field-spec
// see package-reader.js for more details
//
// also dep string cleanup
// remove tailing '/', '.js'
const astMatcher = require('ast-matcher');
const ensureParsed = astMatcher.ensureParsed;
require('../ensure-parser-set')();
const {stripJsExtension, isPackageName} = require('../shared');
const modifyCode = require('modify-code').default;

const amdDep = astMatcher('define([__anl_deps], __any)');
const namedAmdDep = astMatcher('define(__str, [__anl_deps], __any)');
const cjsDep = astMatcher('require(__any_dep)');
const isUMD = astMatcher('typeof define === "function" && define.amd');
const isUMD2 = astMatcher('typeof define == "function" && define.amd');

module.exports = function(unit) {
  const {contents, replacement, sourceMap, path} = unit;
  const parsed = ensureParsed(contents);

  if (isUMD(parsed) || isUMD2(parsed)) {
    // Skip lib in umd format, because browersify umd build could
    // use require('./file.js') which we should not strip .js
    return;
  }

  const filename = sourceMap && sourceMap.file || path;
  const m = modifyCode(contents, filename, {noJsx: true, noTypeScript: true});

  const _find = node => {
    if (node.type !== 'Literal') return;
    let dep = node.value;

    // remove tailing '/'
    if (dep.endsWith('/')) {
      dep = dep.slice(0, -1);
    }

    // remove tailing '.js', but only when dep is not
    // referencing a npm package main
    if (!isPackageName(dep)) {
      dep = stripJsExtension(dep);
    }

    // browser replacement;
    if (replacement && replacement[dep]) {
      dep = replacement[dep];
    }

    if (node.value !== dep) {
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

  const result = m.transform();
  if (result.code === contents) {
    // no change
    return;
  }

  return {
    contents: result.code,
    sourceMap: result.map
  };
};
