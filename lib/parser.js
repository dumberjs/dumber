const {analyze} = require('eslint-scope');
const astMatcher = require('ast-matcher');
const {ensureParsed, compilePattern, extract, traverse, STOP} = astMatcher;
require('./ensure-parser-set')();

// https://github.com/jrburke/amdefine
const amdefinePattern = compilePattern('var define = require("amdefine")(__anl)').declarations[0];

function globalIndentifiers (code) {
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

const cjsDeps = function (code, globals) {
  let deps = [];

  let matches = cjsRequireFinder(code);
  if (matches) {
    matches.forEach(function (m) {
      if (globals['require'].indexOf(m.node.callee) !== -1) {
        deps.push(m.node.arguments[0].value);
      }
    });
  }

  if (deps.length) return deps;
};

function usesCommonJs (code, globals) {
  let ast = ensureParsed(code);
  if (!globals) {
    globals = globalIndentifiers(ast);
  }
  let usage = {};

  if (globals['require']) {
    const deps = cjsDeps(ast, globals);
    if (deps) usage.require = deps;
  }

  if (globals['exports']) usage['exports'] = true;
  if (globals['module']) usage['moduleExports'] = true;
  if (globals['__dirname']) usage['dirname'] = true;
  if (globals['__filename']) usage['filename'] = true;
  // special nodejs globals
  if (globals['global']) usage['global'] = true;
  if (globals['process']) usage['process'] = true;
  if (globals['Buffer']) usage['Buffer'] = true;

  if (Object.keys(usage).length) {
    return usage;
  }
}

const amdRequireFinders = [
  astMatcher('require([__anl])'),
  astMatcher('require([__anl], __any)')
];

const amdRequireFinders2 = [
  // first param is a requirejs config
  astMatcher('require(__any, [__anl])'),
  astMatcher('require(__any, [__anl], __any)'),
];

const amdRequireDeps = function (code, globals) {
  let deps = [];

  amdRequireFinders.forEach(function (f) {
    let matches = f(code);
    if (matches) {
      matches.forEach(function (m) {
        if (globals['require'].indexOf(m.node.callee) !== -1) {
          m.node.arguments[0].elements.forEach(arg => {
            deps.push(arg.value);
          })
        }
      });
    }
  });

  amdRequireFinders2.forEach(function (f) {
    let matches = f(code);
    if (matches) {
      matches.forEach(function (m) {
        if (globals['require'].indexOf(m.node.callee) !== -1) {
          m.node.arguments[1].elements.forEach(arg => {
            deps.push(arg.value);
          })
        }
      });
    }
  });

  if (deps.length) return deps;
};

const amdRequireJSFinders = [
  astMatcher('requirejs([__anl])'),
  astMatcher('requirejs([__anl], __any)')
];

const amdRequireJSFinders2 = [
  // first param is a requirejs config
  astMatcher('requirejs(__any, [__anl])'),
  astMatcher('requirejs(__any, [__anl], __any)'),
];

const amdRequireJSDeps = function (code, globals) {
  let deps = [];

  amdRequireJSFinders.forEach(function (f) {
    let matches = f(code);
    if (matches) {
      matches.forEach(function (m) {
        if (globals['requirejs'].indexOf(m.node.callee) !== -1) {
          m.node.arguments[0].elements.forEach(arg => {
            if (arg.type === 'Literal' || arg.type === 'StringLiteral') deps.push(arg.value);
          })
        }
      });
    }
  });

  amdRequireJSFinders2.forEach(function (f) {
    let matches = f(code);
    if (matches) {
      matches.forEach(function (m) {
        if (globals['requirejs'].indexOf(m.node.callee) !== -1) {
          m.node.arguments[1].elements.forEach(arg => {
            if (arg.type === 'Literal' || arg.type === 'StringLiteral') deps.push(arg.value);
          })
        }
      });
    }
  });

  if (deps.length) return deps;
};

const amdRequireConfigFinder = astMatcher('require.config(__anl)');
const amdRequireJSConfigFinder = astMatcher('requirejs.config(__anl)');

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

const findAmdRequireJSConfigIdentifiers = function (code) {
  let requireIdendifers = [];

  let matches = amdRequireJSConfigFinder(code);
  if (matches) {
    matches.forEach(function (m) {
      requireIdendifers.push(m.node.callee.object);
    });
  }

  if (requireIdendifers.length) return requireIdendifers;
};

function usesAmdOrRequireJs (code, globals) {
  let ast = ensureParsed(code);
  if (!globals) {
    globals = globalIndentifiers(ast);
  }
  let usage = {};


  if (globals['requirejs']) {
    const deps = amdRequireJSDeps(ast, globals);
    if (deps) usage['requirejs'] = deps;

    if (some(globals['requirejs'], findAmdRequireJSConfigIdentifiers(ast))) {
      usage['requireConfig'] = true;
    }
  }

  if (globals['require']) {
    const deps = amdRequireDeps(ast, globals);
    if (deps) usage['require'] = deps;

    if (some(globals['require'], findAmdRequireConfigIdentifiers(ast))) {
      usage['requireConfig'] = true;
    }
  }

  if (globals['define']) {
    usage['define'] = true;
    // We didn't implement declaresDefine and defineAmd here.
    // If we want, use eslint-scope getDeclaredVariables(node) api to get function definition in inner scope.
  }

  if (Object.keys(usage).length) {
    return usage;
  }
}

function usesEsm(code) {
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

exports.globalIndentifiers = globalIndentifiers;
exports.usesCommonJs = usesCommonJs;
exports.usesAmdOrRequireJs = usesAmdOrRequireJs;
exports.usesEsm = usesEsm;
