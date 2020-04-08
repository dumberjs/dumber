const {globalIndentifiers, usesCommonJs, usesAmdOrRequireJs} = require('../parser');
const {warn} = require('../log');
const astMatcher = require('ast-matcher');
const ensureParsed = astMatcher.ensureParsed;
const modifyCode = require('modify-code').default;

const defineCallFinder = astMatcher('define(__anl_args)');
// import() has been translated to imp0r_() in cjs-to-amd.js
const dynamicDepFinder = astMatcher.depFinder('imp0r_(__dep)');

// transform an anonymous amd define() into named define.
// find deps.
module.exports = function nameAmdDefine(unit) {
  const ast = ensureParsed(unit.contents);
  const result = ensureNamedDefine(unit, ast);

  const amd = usesAmdOrRequireJs(ast, globalIndentifiers(ast));
  if (amd) {
    if (amd['require']) {
      result.deps.push.apply(result.deps, amd['require']);
    }
    if (amd['requirejs']) {
      result.deps.push.apply(result.deps, amd['requirejs']);
    }
  }

  dynamicDepFinder(ast).forEach(d => {
    if (result.deps.indexOf(d) === -1) {
      result.deps.push(d);
    }
  });

  result.deps = result.deps.filter(d => {
    // remove cjs constants
    if (d === 'require' || d === 'exports' || d === 'module') return false;
    // remove local defined
    if (result.defined && result.defined.indexOf(d) !== -1) return false;
    return true;
  });

  return result;
};

function ensureNamedDefine(unit, ast) {
  const {contents, moduleId, sourceMap, path} = unit;

  let defineCalls = defineCallFinder(ast);
  if (!defineCalls) {
    return {defined: [], deps: []}
  }

  let definesIdentifiers = globalIndentifiers(ast).define;

  defineCalls = defineCalls.filter(function (match)  {
    return definesIdentifiers.indexOf(match.node.callee) !== -1;
  });

  let deps = [];

  if (defineCalls.length > 1) {
    warn('for module "' + moduleId +
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

    return {defined, deps};
  } else if (defineCalls.length === 0) {
    warn('for module "' + moduleId +
      '", no direct define() call found, skip named define rewrite.');
    return {defined: [], deps: []}
  }

  let args = defineCalls[0].match.args;
  if (args.length === 0) {
    warn('for module "' + moduleId +
      '", found empty define call, skip named define rewrite.');
    return {defined: [], deps: []};
  }

  let namedDefine;
  let needsScanDeps = true;
  let firstArgLoc = args[0].start;

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
    warn('for module "' + moduleId +
      '", found define call with runtime module name or deps, skip named define rewrite.');
    // for example: define(runtimeName, [], factory)
    return {defined: namedDefine ? [namedDefine] : [], deps: []};
  }

  let factory = args[0];

  if (!factory) {
    warn('for module "' + moduleId +
      '", found define call with no implementation, skip named define rewrite.');
    return {defined: namedDefine ? [namedDefine] : [], deps: []};
  }

  if (!(factory.type.endsWith('FunctionExpression') ||  // define(function() {});
        factory.type === 'Identifier' ||                // define(factory)
        (
          factory.type === 'MemberExpression' &&        // define(this.key)
          factory.object &&
          factory.property &&
          factory.property.type === 'Identifier'
        ))) {
    // only allow define(function() {}), define(factory), or define(this.key)
    warn('for module "' + moduleId +
      '", found define call with non-function non-factory implementation, skip named define rewrite.');
    return {defined: namedDefine ? [namedDefine] : [], deps: []};
  }

  const filename = sourceMap && sourceMap.file || path;
  const m = modifyCode(contents, filename, {noJsx: true, noTypeScript: true});

  if (!namedDefine) {
    m.insert(firstArgLoc, "'" + moduleId + "',")
    namedDefine = moduleId;
  }

  if (factory.type.endsWith('FunctionExpression') && needsScanDeps) {
    let cjsDeps = [];

    let factoryArgLen = factory.params && factory.params.length;
    if (factoryArgLen) {
      if (factoryArgLen >= 1) cjsDeps.push('require');
      if (factoryArgLen >= 2) cjsDeps.push('exports');
      if (factoryArgLen >= 3) cjsDeps.push('module');
    }

    const tree = {
      type: 'Program',
      sourceType: 'module',
      body: factory.body.body
    };

    const cjs = usesCommonJs(tree, globalIndentifiers(tree));
    if (cjs && cjs['require']) {
      deps = cjs['require'];
      cjsDeps.push.apply(cjsDeps, deps);
    } else {
      deps = [];
    }

    if (cjsDeps.length) {
      m.insert(factory.start, depsString(cjsDeps) + ',');
    }
  }

  const result = m.transform();

  const newUnit = {defined: [namedDefine], deps};
  if (result.code !== contents) {
    newUnit.contents = result.code;
    newUnit.sourceMap = result.map;
  }
  return newUnit;
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
