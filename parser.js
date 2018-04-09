'use strict';
require('./ensure-parser-set');
const escope = require('escope');
const astMatcher = require('ast-matcher');
const ensureParsed = astMatcher.ensureParsed;

function globalIndentifiers (code) {
  let ast = ensureParsed(code);
  let scopeManager = escope.analyze(ast, {ecmaVersion: 6});
  let globalScope = scopeManager.acquire(ast);

  let globalIndentifiers = {};

  globalScope.through.forEach(function (ref) {
    let name = ref.identifier.name;
      // console('name: ' + name);
    // user defined the variable in global scope
    if (globalScope.set.get(name)) {
      // console.log(globalScope.set.get(name));
      return;
    }

    if (globalIndentifiers[name]) {
      globalIndentifiers[name].push(ref.identifier);
    } else {
      globalIndentifiers[name] = [ref.identifier];
    }
  });

  return globalIndentifiers;
}

function hasOne(list, interested) {
  if (interested) {
    let len = interested.length
    for (let i = 0; i < len; i += 1) {
      let item = interested[i];

      if (list.indexOf(item) !== -1) {
        return true;
      }
    }
  }
}

const cjsRequireFinder = astMatcher('require(__str)');

const findCjsRequireIdentifiers = function (code) {
  let requireIdendifers = [];

  let matches = cjsRequireFinder(code);
  if (matches) {
    matches.forEach(function (m) {
      requireIdendifers.push(m.node.callee);
    });
  }

  if (requireIdendifers.length) return requireIdendifers;
};

function usesCommonJs (code) {
  let ast = ensureParsed(code);
  let globals = globalIndentifiers(ast);
  let usage = {};

  if (globals['require'] && hasOne(globals['require'], findCjsRequireIdentifiers(ast))) {
    usage.require = true;
  }

  if (globals['exports']) usage.exports = true;
  if (globals['module']) usage.moduleExports = true;
  if (globals['__dirname']) usage.dirname = true;
  if (globals['__filename']) usage.filename = true;

  if (Object.keys(usage).length) {
    return usage;
  }
}

const amdRequireFinders = [
  astMatcher('require([__anl])'),
  astMatcher('require([__anl], __any)'),
  astMatcher('require(__any, [__anl])'),
  astMatcher('require(__any, [__anl], __any)'),
];

const findAmdRequireIdentifiers = function (code) {
  let requireIdendifers = [];

  amdRequireFinders.forEach(function (f) {
    let matches = f(code);
    if (matches) {
      matches.forEach(function (m) {
        requireIdendifers.push(m.node.callee);
      });
    }
  });

  if (requireIdendifers.length) return requireIdendifers;
};

const amdRequireConfigFinder = astMatcher('require.config(__anl)');

const findAmdRequireConfigIdentifiers = function (code) {
  let requireIdendifers = [];

  let matches = amdRequireConfigFinder(code);
  if (matches) {
    matches.forEach(function (m) {
      requireIdendifers.push(m.node.callee.object);
    });
  }

  if (requireIdendifers.length) return requireIdendifers;
};

function usesAmdOrRequireJs (code) {
  let ast = ensureParsed(code);
  let globals = globalIndentifiers(ast);
  let usage = {};

  if (globals['requirejs']) usage.requirejs = true;

  if (globals['require']) {
    let list = globals['require'];
    if (hasOne(list, findAmdRequireIdentifiers(ast))) {
      usage.require = true;
    }

    if (hasOne(list, findAmdRequireConfigIdentifiers(ast))) {
      usage.requireConfig = true;
    }
  }

  if (globals['define']) {
    usage.define = true;
    // We didn't implement declaresDefine and defineAmd here.
    // If we want, use eslint-scope getDeclaredVariables(node) api to get function definition in inner scope.
  }

  if (Object.keys(usage).length) {
    return usage;
  }
}

exports.globalIndentifiers = globalIndentifiers;
exports.usesCommonJs = usesCommonJs;
exports.usesAmdOrRequireJs = usesAmdOrRequireJs;
