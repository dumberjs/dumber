/* eslint no-console: 0 */
// TODO need a logger implementation to remove usage of console
'use strict';
const parser = require('./parser');
const astMatcher = require('ast-matcher');
const ensureParsed = astMatcher.ensureParsed;

const defineCallFinder = astMatcher('define(__anl_args)');
const cjsDepFinder = astMatcher.depFinder('require(__dep)');

// Transform an anonymous define() into named define.
// So the contents can be used in a bundle.
function defines(moduleName, amdContents) {
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
    console.warn('for module "' + moduleName + '", more than one define calls found, skip named define rewrite.');

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
    console.warn('for module "' + moduleName + '", found empty define call, skip named define rewrite.');
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
    console.warn('for module "' + moduleName + '", found define call with runtime module name or deps, skip named define rewrite.');
    return {
      defined: namedDefine || null,
      contents: amdContents
    };
  }

  let factory = args[0];

  if (!factory) {
    console.warn('for module "' + moduleName + '", found define call with no implementaton, skip named define rewrite.');
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
    console.warn('for module "' + moduleName + '", found define call with non-function non-factory implementaton, skip named define rewrite.');
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
                    '[' + deps.map(function(d) { return "'" + d + "'"; }).join(',') + '],' +
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

module.exports = defines;