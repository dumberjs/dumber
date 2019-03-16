import {globalIndentifiers} from '../parser';
import {warn} from '../log';
import astMatcher from 'ast-matcher';
const ensureParsed = astMatcher.ensureParsed;
import modifyCode from 'modify-code';

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

// transform an anonymous amd define() into named define.
// find deps.
export default function(unit) {
  const result = ensureNamedDefine(unit);

  amdRequireDepFinder(unit.contents).forEach(d => {
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
}

function ensureNamedDefine(unit) {
  const {contents, moduleId, sourceMap, path} = unit;
  let ast = ensureParsed(contents);

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
  }

  let args = defineCalls[0].match.args;
  if (args.length === 0) {
    warn('for module "' + moduleId +
      '", found empty define call, skip named define rewrite.');
    return {defined: [], deps: []};
  }

  let namedDefine;
  let needsScanDeps = true;
  let firstArgLoc = args[0].start; // .start for cherow, .range[0] for esprima

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
  const m = modifyCode(contents, filename);

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

    deps = cjsDepFinder(factory);
    if (deps.length) {
      cjsDeps.push.apply(cjsDeps, deps);
    }

    if (cjsDeps.length) {
      m.insert(factory.start, depsString(cjsDeps) + ','); // .start for cherow, .range[0], for esprima
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
