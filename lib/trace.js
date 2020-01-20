'use strict';
const hackMoment = require('./transformers/hack-moment');
const processEnv = require('./transformers/process-env');
const nodeEnvCondition = require('./transformers/node-env-condition');
const alias = require('./transformers/alias');
const conventionalAlias = require('./transformers/conventional-alias');
const text = require('./transformers/text');
const json = require('./transformers/json');
const wasm = require('./transformers/wasm');
const esmToCjs = require('./transformers/esm-to-cjs');
const replace = require('./transformers/replace');
const cjsToAmd = require('./transformers/cjs-to-amd');
const nameAmdDefine = require('./transformers/name-amd-define');
const shimAmd = require('./transformers/shim-amd');
const transform = require('./transform');
const {ext} = require('dumber-module-loader/dist/id-utils');
const {generateHash} = require('./shared');

function unWrap(cached) {
  return Promise.resolve(cached)
    .then(result => {
      if (!result) {
        throw new Error();
      } else if (result instanceof Error) {
        throw result;
      }
      return result;
    })
}

// depsFinder is optional
module.exports = function(unit, opts = {}) {
  const {cache, depsFinder} = opts;
  const {contents, path, sourceMap, moduleId, packageName, shim} = unit;

  if (packageName && (moduleId !== packageName && !moduleId.startsWith(packageName + '/'))) {
    return Promise.reject(new Error('module "' + moduleId + '" is not in package "' + packageName + '"'));
  }

  let hash;

  let tryCache;
  if (cache) {
    const key = [
      process.env.NODE_ENV || '',
      path,
      moduleId,
      packageName,
      JSON.stringify(shim),
      depsFinder ? depsFinder.toString() : '',
      contents,
      JSON.stringify(sourceMap)
    ].join('|');
    hash = generateHash(key);
    tryCache = unWrap(cache.getCache(hash, {packageName, moduleId}));
  } else {
    tryCache = Promise.reject();
  }

  return tryCache.catch(() => {
    const transformers = [];
    const extname = ext(path);
    if (extname === '.js') {
      transformers.push(
        hackMoment,
        processEnv,
        nodeEnvCondition,
        esmToCjs,
        replace,
        cjsToAmd,
        nameAmdDefine,
        shimAmd
      );
    } else if (extname === '.wasm') {
      transformers.push(wasm);
    } else if (extname === '.json') {
      transformers.push(json);
    } else {
      // use text! for everything else including unknown extname
      transformers.push(text);
    }

    // for alias to npm package main, browser replacement
    transformers.push(alias);
    // for alias like: foo/index -> foo/dist/cjs/index
    transformers.push(conventionalAlias, alias);

    if (depsFinder) {
      transformers.push(function customDepsFinder(unit) {
        // customised deps finder to find addtional deps
        return new Promise(resolve => {
          // note it works on original contents, not transformed contents
          resolve(depsFinder(unit.path, contents));
        }).then(deps => ({deps}));
      });
    }

    return transform(unit, ...transformers)
      .then(traced => {
        if (cache) cache.setCache(hash, traced);
        return traced;
      });
  });
};
