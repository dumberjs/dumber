import {analyze} from 'escope';
import astMatcher, {ensureParsed, compilePattern, extract, traverse, STOP} from 'ast-matcher';
import './ensure-parser-set';

// https://github.com/jrburke/amdefine
const amdefinePattern = compilePattern('var define = require("amdefine")(__anl)').declarations[0];

export function globalIndentifiers (code) {
  let ast = ensureParsed(code);
  let scopeManager = analyze(ast, {ecmaVersion: 6});
  let globalScope = scopeManager.acquire(ast);

  // This is very interesting.
  // If you do `let globals = {};`, globals actually has some properties inherited
  // like __defineSetter__, which makes globals['__defineSetter__'] not empty!
  // Check last test in spec/parser.uses-common-js.spec.js
  let globals = Object.create(null);

  globalScope.through.forEach(function (ref) {
    let name = ref.identifier.name;
    // user defined the variable in global scope
    let variable = globalScope.set.get(name);
    // amdefine will be ignored in browser,
    // don't remove 'define' from the list.
    if (variable && !(name === 'define' && extract(amdefinePattern, variable.defs[0].node))) {
      return;
    }

    if (globals[name]) {
      globals[name].push(ref.identifier);
    } else {
      globals[name] = [ref.identifier];
    }
  });

  return globals;
}

function some(list, interested) {
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

export function usesCommonJs (code, globals) {
  let ast = ensureParsed(code);
  if (!globals) {
    globals = globalIndentifiers(ast);
  }
  let usage = {};

  if (globals['require'] && some(globals['require'], findCjsRequireIdentifiers(ast))) {
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

export function usesAmdOrRequireJs (code, globals) {
  let ast = ensureParsed(code);
  if (!globals) {
    globals = globalIndentifiers(ast);
  }
  let usage = {};

  if (globals['requirejs']) usage.requirejs = true;

  if (globals['require']) {
    let list = globals['require'];
    if (some(list, findAmdRequireIdentifiers(ast))) {
      usage.require = true;
    }

    if (some(list, findAmdRequireConfigIdentifiers(ast))) {
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

export function usesEsm(code) {
  let ast = ensureParsed(code);
  let isEsm = false;
  traverse(ast, node => {
    if (node.type === 'ImportDeclaration' ||
        node.type === 'ExportAllDeclaration' ||
        node.type === 'ExportDefaultDeclaration' ||
        node.type === 'ExportNamedDeclaration') {
      isEsm = true;
      return STOP;
    }
  });
  return isEsm;
}
