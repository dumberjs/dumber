const {warn} = require('../log');
const modifyCode = require('modify-code').default;

module.exports = function shimAmd(unit) {
  const { moduleId, defined, contents, sourceMap, path} = unit;
  let {shim} = unit;

  // mimic requirejs runtime behaviour,
  // if no module defined, add an empty shim
  if (!shim && (!defined || !defined.length)) {
    // when defines transformer did make a named define,
    // this shim placeholder will be ignore by the transformer.
    shim = { deps: [] };
  }

  if (!shim) return;

  // bypass shim settings as package already defined amd module
  if (defined.length) {
    if (shim.deps && shim.deps.length) {
      warn('for module "' + moduleId + '", it defined amd module "' +
                 defined + '", ignores shim settings ' +
                 JSON.stringify(shim));
    }
    return;
  }

  const filename = sourceMap && sourceMap.file || path;
  const m = modifyCode(contents, filename, {noJsx: true, noTypeScript: true});

  if (shim.wrapShim) {
    m.prepend(`(function(root) {\ndefine('${moduleId}',`);
    if (shim.deps && shim.deps.length) {
      m.prepend(depsString(shim.deps) + ',');
    }
    m.prepend('function() {\n  return (function() {\n');

    // Start with a \n in case last line is a comment
    // in the contents, like a sourceURL comment.
    m.append(';\n');
    m.append(exportsFn(shim.exports, true));
    m.append('\n  }).apply(root, arguments);\n});\n}(this));\n');
  } else {
    m.append(`;\ndefine('${moduleId}',`);
    if (shim.deps && shim.deps.length) {
      m.append(depsString(shim.deps) + ',');
    }
    m.append(exportsFn(shim.exports));
    m.append(');\n');
  }

  const result = m.transform();
  return {
    defined: [moduleId],
    deps: shim.deps || [],
    shimed: true,
    contents: result.code,
    sourceMap: result.map
  };
};

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

function depsString(deps) {
  return '[' + deps.map(function(d) { return "'" + d + "'"; }).join(',') + ']';
}
