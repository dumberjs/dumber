import {usesEsm} from '../parser';
import {ensureParsed} from 'ast-matcher';
import {transform} from '@babel/core';
import transformCjs from '@babel/plugin-transform-modules-commonjs';
import syntaxDynamicImport from '@babel/plugin-syntax-dynamic-import';

// wrap esm into cjs if needed
export default function(unit) {
  let ast = ensureParsed(unit.contents);

  if (usesEsm(ast)) {
    const filename = unit.sourceMap && unit.sourceMap.file || unit.path;
    const cjs = transform(unit.contents, {
      babelrc: false,
      sourceMaps: true,
      filename: filename,
      sourceFileName: filename,
      plugins: [[transformCjs, {"loose": true}], syntaxDynamicImport]
    });

    // fillup file name
    if (!cjs.map.file) cjs.map.file = filename;

    return {
      contents: cjs.code,
      sourceMap: cjs.map,
      forceWrap: true // force cjs wrap in later stage
    };
  }

  // nil transform
}
