'use strict';
import hackMoment from './transformers/hack-moment';
import alias from './transformers/alias';
import conventionalAlias from './transformers/conventional-alias';
import text from './transformers/text';
import wasm from './transformers/wasm';
import esmToCjs from './transformers/esm-to-cjs';
import replace from './transformers/replace';
import cjsToAmd from './transformers/cjs-to-amd';
import nameAmdDefine from './transformers/name-amd-define';
import shimAmd from './transformers/shim-amd';
import transform from './transform';
import {ext} from 'dumber-module-loader/dist/id-utils';
import {generateHash} from './shared';

// depsFinder is optional
export default function(unit, opts = {}) {
  const {cache, depsFinder} = opts;
  const {contents, path, sourceMap, moduleId, packageName, shim} = unit;

  if (packageName && (moduleId !== packageName && !moduleId.startsWith(packageName + '/'))) {
    return Promise.reject(new Error('module "' + moduleId + '" is not in package "' + packageName + '"'));
  }

  let hash;

  if (cache) {
    const key = [
      path,
      moduleId,
      packageName,
      JSON.stringify(shim),
      depsFinder ? depsFinder.toString() : '',
      contents,
      sourceMap
    ].join('|');
    hash = generateHash(key);
    const cached = cache.getCache(hash);
    if (cached) {
      return Promise.resolve(cached);
    }
  }

  const transformers = [];
  const extname = ext(path);
  if (extname === '.js') {
    transformers.push(
      hackMoment,
      esmToCjs,
      replace,
      cjsToAmd,
      nameAmdDefine,
      shimAmd
    );
  } else if (extname === '.wasm') {
    transformers.push(wasm);
  } else {
    // use text! for everything else including unknown extname
    transformers.push(text);
  }

  // for alias to npm package main, browser replacement
  transformers.push(alias);
  // for alias like: foo/index -> foo/dist/cjs/index
  transformers.push(conventionalAlias, alias);

  transformers.push(function(unit) {
    // customised deps finder to find addtional deps
    if (depsFinder) {
      return new Promise(resolve => {
        // note it works on original contents, not transformed contents
        resolve(depsFinder(unit.path, contents));
      }).then(deps => ({deps}));
    }
  });

  return transform(unit, ...transformers)
    .then(traced => {
      if (cache) cache.setCache(hash, traced);
      return traced;
    });
}
