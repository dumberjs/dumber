'use strict';
const logger = require('gulplog');
const parser = require('../parser');
const astMatcher = require('ast-matcher');
const ensureParsed = astMatcher.ensureParsed;

const defineCallFinder = astMatcher('define(__anl_args)');
const cjsDepFinder = astMatcher.depFinder('require(__dep)');
const amdRequireDepFinder = astMatcher.depFinder(
  'require([__deps])',               // amd require
  'require([__deps], __any)',
  'require(__any, [__deps])',
  'require(__any, [__deps], __any)',
  'requirejs([__deps])',             // amd requirejs
  'requirejs([__deps], __any)',
  'requirejs(__any, [__deps])',
  'requirejs(__any, [__deps], __any)'
);

module.exports = function(moduleName, amdContents, shim) {
  let result = ensureNamedDefine(moduleName, amdContents);

  let reqDeps = amdRequireDepFinder(result.contents);
  if (reqDeps.length) {
    result.deps.push.apply(result.deps, reqDeps);
  }

  if (!shim) return result;
  // bypass shim settings as package already defined amd module
  if (result.defined) {
    logger.warn('for module "' + moduleName + '", it defined amd module "' +
                 result.defined + '", ignores shim settings ' +
                 JSON.stringify(shim));
    return result;
  }

  let contents = result.contents;

  if (shim.wrapShim) {
    contents = '(function(root) {\n' +
               'define("' + moduleName + '", ' +
               (shim.deps && shim.deps.length ?
                      depsString(shim.deps) + ', ' : '') +
              'function() {\n' +
              '  return (function() {\n' +
                   contents +
                   // Start with a \n in case last line is a comment
                   // in the contents, like a sourceURL comment.
                   '\n' + exportsFn(shim.exports, true) +
                   '\n' +
              '  }).apply(root, arguments);\n' +
              '});\n' +
              '}(this));\n';
    result.headLines = 3;
  } else {
    contents += '\n' + 'define("' + moduleName + '", ' +
                   (shim.deps && shim.deps.length ?
                          depsString(shim.deps) + ', ' : '') +
                   exportsFn(shim.exports) +
                   ');\n';
  }

  result.defined = moduleName;
  result.deps = shim.deps || [];
  result.contents = contents;
  return result;
}

function exportsFn(_exports, wrapShim) {
  if (_exports) {
    if (wrapShim) return 'return root.' + _exports + ' = ' + _exports +';';
    else return '(function (global) {\n' +
                '  return function () {\n' +
                '    return global.' + _exports + ';\n' +
                '  };\n' +
                '}(this))';
  } else {
    if (wrapShim) return '';
    return 'function(){}';
  }
}

// Transform an anonymous define() into named define.
// So the contents can be used in a bundle.
function ensureNamedDefine (moduleName, amdContents) {
  let ast = ensureParsed(amdContents);

  let defineCalls = defineCallFinder(ast);
  if (!defineCalls) {
    return {
      defined: null,
      deps: [],
      contents: amdContents
    }
  }

  let definesIdentifiers = parser.globalIndentifiers(ast).define;

  defineCalls = defineCalls.filter(function (match)  {
    return definesIdentifiers.indexOf(match.node.callee) !== -1;
  });

  let deps = [];

  if (defineCalls.length > 1) {
    logger.warn('for module "' + moduleName +
      '", more than one define calls found, skip named define rewrite.');

    let defined = [];

    defineCalls.forEach(function (match) {
      let args = match.match.args;
      let possibleDepsNode = args[0];

      if (args[0] && args[0].type === 'Literal') {
        defined.push(args[0].value);
        possibleDepsNode = args[1];
      }

      if (possibleDepsNode && possibleDepsNode.type === 'ArrayExpression') {
        depsArray(possibleDepsNode.elements).forEach(function (d) {
          deps.push(d);
        });
      }
    })

    return {
      defined: defined.length ? defined : null,
      deps,
      contents: amdContents
    };
  }

  let args = defineCalls[0].match.args;
  if (args.length === 0) {
    logger.warn('for module "' + moduleName +
      '", found empty define call, skip named define rewrite.');
    return {
      defined: null,
      deps: [],
      contents: amdContents
    };
  }

  let namedDefine;
  let needsScanDeps = true;
  let firstArgLoc = args[0].range[0];

  if (args[0].type === 'Literal') {
    // already has named define
    namedDefine = args[0].value;
    args.shift();
  }

  if (args[0].type === 'ArrayExpression') {
    needsScanDeps = false;

    depsArray(args[0].elements).forEach(function (d) {
      deps.push(d);
    });

    args.shift();
  }

  if (args.length > 1) {
    logger.warn('for module "' + moduleName +
      '", found define call with runtime module name or deps, skip named define rewrite.');
    return {
      defined: namedDefine || null,
      deps: [],
      contents: amdContents
    };
  }

  let factory = args[0];

  if (!factory) {
    logger.warn('for module "' + moduleName +
      '", found define call with no implementaton, skip named define rewrite.');
    return {
      defined: namedDefine || null,
      deps: [],
      contents: amdContents
    };
  }

  if (!(factory.type.endsWith('FunctionExpression') ||  // define(function() {});
        factory.type === 'Identifier' ||                // define(factory)
        (
          factory.type === 'MemberExpression' &&        // define(this.key)
          factory.object &&
          factory.property &&
          factory.property.type === 'Identifier'
        ))) {
    // only allow define(function() {}) and define(factory)
    logger.warn('for module "' + moduleName +
      '", found define call with non-function non-factory implementaton, skip named define rewrite.');
    return {
      defined: namedDefine || null,
      deps: [],
      contents: amdContents
    };
  }

  if (factory.type.endsWith('FunctionExpression') && needsScanDeps) {
    let cjsDeps = [];

    let factoryArgLen = factory.params && factory.params.length;
    if (factoryArgLen) {
      if (factoryArgLen >= 1) cjsDeps.push('require');
      if (factoryArgLen >= 2) cjsDeps.push('exports');
      if (factoryArgLen >= 3) cjsDeps.push('module');
    }

    deps = cjsDepFinder(factory);
    if (deps.length) {
      cjsDeps.push.apply(cjsDeps, deps);
    }

    if (cjsDeps.length) {
      amdContents = amdContents.substring(0, factory.range[0]) +
                    depsString(cjsDeps) + ',' +
                    amdContents.substring(factory.range[0]);
    }
  }

  if (!namedDefine) {
    amdContents = amdContents.substring(0, firstArgLoc) +
                    "'" + moduleName + "'," +
                    amdContents.substring(firstArgLoc);
    namedDefine = moduleName;
  }

  return {
    defined: namedDefine,
    deps,
    contents: amdContents
  };
}

function depsArray(nodes) {
  let deps = [];
  nodes.forEach(function (node) {
    if (node.type === 'Literal') {
      deps.push(node.value);
    }
  });
  return deps;
}

function depsString(deps) {
  return '[' + deps.map(function(d) { return "'" + d + "'"; }).join(',') + ']';
}
