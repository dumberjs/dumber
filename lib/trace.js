'use strict';
const json = require('./transformers/json');
const text = require('./transformers/text');
const cjs = require('./transformers/cjs');
const defines = require('./transformers/defines');
const resolveModuleId = require('./resolve-module-id');

const text_exts = ['.html', '.htm', '.svg', '.css'];

// depsFinder is optional
module.exports = function (unit, depsFinder) {
  const path = unit.path;
  let contents = unit.contents;
  let sourceMap = unit.sourceMap;
  const moduleId = unit.moduleId;
  const packageName = unit.packageName;
  const shim = unit.shim;

  if (packageName && !moduleId.startsWith(packageName + '/')) {
    throw new Error('module "' + moduleId + '" is not in package "' + packageName + '"');
  }

  let deps = new Set();
  let defined;

  // customised deps finder
  if (depsFinder) {
    let newDeps = depsFinder(path, contents);
    if (newDeps && newDeps.length) {
      newDeps.forEach(function (d) { deps.add(resolveModuleId(moduleId, d)); });
    }
  }

  if (path.endsWith('.js')) {
    const forceCjsWrap = !!path.match(/\/(cjs|commonjs)\//i);
    let cjsResult = cjs(contents, forceCjsWrap);
    let defResult = defines(moduleId, cjsResult.contents, shim);

    let headLines = (cjsResult.headLines || 0) + (defResult.headLines || 0);
    if (headLines && sourceMap) {
      let prefix = '';
      for (let i = 0; i < headLines; i += 1) prefix += ';';
      sourceMap.mappings = prefix + sourceMap.mappings;
    }

    if (defResult.deps) {
      defResult.deps.forEach(function (d) { deps.add(resolveModuleId(moduleId, d)); });
    }

    contents = defResult.contents;
    defined = defResult.defined;
  } else if (path.endsWith('.json')) {
    sourceMap = undefined;
    let jsonResult = json(moduleId, contents);
    contents = jsonResult.contents;
    defined = jsonResult.defined;
  } else if (text_exts.findIndex(function (t) { return path.endsWith(t); }) !== -1) {
    sourceMap = undefined;
    let textResult = text(moduleId, contents);
    contents = textResult.contents;
    defined = textResult.defined;
  }

  return {
    path: path,
    contents: contents,
    sourceMap: sourceMap,
    moduleId: unit.moduleId,
    defined: defined,
    deps: Array.from(deps).sort(),
    packageName: packageName,
    shim: shim
  };
};
