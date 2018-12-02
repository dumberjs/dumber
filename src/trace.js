'use strict';
import text from './transformers/text';
import cjsEs from './transformers/cjs-es';
import defines from './transformers/defines';
import {ext, resolveModuleId} from 'dumber-module-loader/dist/id-utils';
import {generateHash} from './shared';

// depsFinder is optional
export default function (unit, opts = {}) {
  const {cache, depsFinder} = opts;

  const path = unit.path;
  let contents = unit.contents;
  let sourceMap = unit.sourceMap;
  const moduleId = unit.moduleId;
  const packageName = unit.packageName;
  let shim = unit.shim;
  let shimed;

  if (packageName && !moduleId.startsWith(packageName + '/')) {
    return Promise.reject(new Error('module "' + moduleId + '" is not in package "' + packageName + '"'));
  }

  let hash;

  if (cache) {
    const key = [
      moduleId,
      packageName,
      JSON.stringify(shim),
      contents
    ].join('|');
    hash = generateHash(key);
    const cached = cache.getCache(hash);
    if (cached) {
      return Promise.resolve(cached);
    }
  }

  let deps = new Set();
  let defined;
  let extname = ext(path);

  if (extname === '.js') {
    const forceCjsWrap = !!path.match(/\/(cjs|commonjs)\//i);
    let cjsEsResult = cjsEs(contents, forceCjsWrap);

    // mimic requirejs runtime behaviour,
    // if no module defined, add an empty shim
    if (!shim && !forceCjsWrap && cjsEsResult.contents === contents) {
      // when defines transformer did make a named define,
      // this shim placeholder will be ignore by the transformer.
      shim = { deps: [] };
    }

    let defResult = defines(moduleId, cjsEsResult.contents, shim);

    let headLines = (cjsEsResult.headLines || 0) + (defResult.headLines || 0);
    if (headLines && sourceMap) {
      let prefix = '';
      for (let i = 0; i < headLines; i += 1) prefix += ';';
      sourceMap.mappings = prefix + sourceMap.mappings;
    }

    if (defResult.deps) {
      defResult.deps.forEach(d => deps.add(resolveModuleId(moduleId, d)));
    }

    contents = defResult.contents;
    defined = defResult.defined;
    shimed = defResult.shimed;
  } else if (extname !== '.wasm') {
    // use text! for everything else including unknown extname
    sourceMap = undefined;
    let textResult = text(moduleId, contents);
    contents = textResult.contents;
    defined = textResult.defined;
  }

  let p = Promise.resolve();

  // customised deps finder
  if (depsFinder) {
    p = p.then(() => depsFinder(path, unit.contents))
    .then(newDeps => {
      if (newDeps && newDeps.length) {
        newDeps.forEach(d => deps.add(resolveModuleId(moduleId, d)));
      }
    });
  }

  return p.then(() => {
    const traced = {
      path: path,
      contents: contents,
      sourceMap: sourceMap,
      moduleId: unit.moduleId,
      defined: defined,
      deps: Array.from(deps).sort(),
      packageName: packageName,
      shimed: shimed
    };

    if (cache) {
      cache.setCache(hash, traced);
    }

    return traced;
  });
}
