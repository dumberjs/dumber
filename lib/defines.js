'use strict';
const logger = require('gulplog');
const parser = require('./parser');
const astMatcher = require('ast-matcher');
const ensureParsed = astMatcher.ensureParsed;

const defineCallFinder = astMatcher('define(__anl_args)');
const cjsDepFinder = astMatcher.depFinder('require(__dep)');
const amdDepFinder = astMatcher.depFinder(
  'define([__deps], __any)',         // anonymous module
  'define(__str, [__deps], __any)',  // named module
  'require([__deps])',               // amd require
  'require([__deps], __any)',
  'require(__any, [__deps], __any)',
  'requirejs([__deps])',             // amd requirejs
  'requirejs([__deps], __any)',
  'requirejs(__any, [__deps], __any)'
);

module.exports = function(moduleName, amdContents, shim) {
  let result = ensureNamedDefine(moduleName, amdContents);
  if (result.defined) {
    let deps = new Set(amdDepFinder(result.contents));
    // remove deps on cjs wrapper
    ['require', 'exports', 'module'].forEach(d => deps.delete(d));
    result.deps = Array.from(deps).sort();
  } else {
    result.deps = [];
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
      contents: amdContents
    }
  }

  let definesIdentifiers = parser.globalIndentifiers(ast).define;

  defineCalls = defineCalls.filter(function (match)  {
    return definesIdentifiers.indexOf(match.node.callee) !== -1;
  });

  if (defineCalls.length > 1) {
    logger.warn('for module "' + moduleName +
      '", more than one define calls found, skip named define rewrite.');

    let defined = [];

    defineCalls.forEach(function (match) {
      let args = match.match.args;
      if (args[0].type === 'Literal') {
        defined.push(args[0].value);
      }
    })

    return {
      defined: defined.length ? defined : null,
      contents: amdContents
    };
  }

  let args = defineCalls[0].match.args;
  if (args.length === 0) {
    logger.warn('for module "' + moduleName +
      '", found empty define call, skip named define rewrite.');
    return {
      defined: null,
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
    args.shift();
  }

  if (args.length > 1) {
    logger.warn('for module "' + moduleName +
      '", found define call with runtime module name or deps, skip named define rewrite.');
    return {
      defined: namedDefine || null,
      contents: amdContents
    };
  }

  let factory = args[0];

  if (!factory) {
    logger.warn('for module "' + moduleName +
      '", found define call with no implementaton, skip named define rewrite.');
    return {
      defined: namedDefine || null,
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
      contents: amdContents
    };
  }

  if (factory.type.endsWith('FunctionExpression') && needsScanDeps) {
    let deps = [];

    let factoryArgLen = factory.params && factory.params.length;
    if (factoryArgLen) {
      if (factoryArgLen >= 1) deps.push('require');
      if (factoryArgLen >= 2) deps.push('exports');
      if (factoryArgLen >= 3) deps.push('module');
    }

    let cjsDeps = cjsDepFinder(factory);
    if (cjsDeps.length) {
      deps.push.apply(deps, cjsDeps);
    }

    if (deps.length) {
      amdContents = amdContents.substring(0, factory.range[0]) +
                    depsString(deps) + ',' +
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
    contents: amdContents
  };
}

function depsString(deps) {
  return '[' + deps.map(function(d) { return "'" + d + "'"; }).join(',') + ']';
}
