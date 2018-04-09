'use strict';
require('./ensure-parser-set');
const escope = require('escope');
const astMatcher = require('ast-matcher');
const ensureParsed = astMatcher.ensureParsed;

function globalRefs (code) {
  let ast = ensureParsed(code);
  let scopeManager = escope.analyze(ast);
  let globalScope = scopeManager.acquire(ast);

  let globalRefs = {};

  globalScope.through.forEach(function (ref) {
    let name = ref.identifier.name;
    // user defined the variable in global scope
    if (globalScope.set.get(name)) return;

    if (globalRefs[name]) {
      globalRefs[name].push(ref.identifier);
    } else {
      globalRefs[name] = [ref.identifier];
    }
  });

  return globalRefs;
}

const findCjsRequire = astMatcher('require(__str)');

function usesCommonJs (code) {
  let ast = ensureParsed(code);
  let globals = globalRefs(ast);
  let usage = {};

  if (globals['require']) {
    let refs = globals['require'];
    let cjsRequireCalls = findCjsRequire(ast);

    if (cjsRequireCalls) {
      let len = cjsRequireCalls.length
      for (let i = 0; i < len; i += 1) {
        let callExp = cjsRequireCalls[i].node;

        if (refs.indexOf(callExp.callee) !== -1) {
          usage.require = true;
          break;
        }
      }
    }
  }
  if (globals['exports']) usage.exports = true;
  if (globals['module']) usage.moduleExports = true;
  if (globals['__dirname']) usage.dirname = true;
  if (globals['__filename']) usage.filename = true;

  if (Object.keys(usage).length) {
    return usage;
  }
}

exports.globalRefs = globalRefs;
exports.usesCommonJs = usesCommonJs;
