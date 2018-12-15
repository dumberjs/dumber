// replace transform is used by package-reader on every npm package

// browser replacement
// https://github.com/defunctzombie/package-browser-field-spec
// see package-reader.js for more details
//
// also dep string cleanup
// remove tailing '/', '.js'
import astMatcher, {ensureParsed, traverse} from 'ast-matcher';
import '../ensure-parser-set';
import {stripJsExtension, isPackageName} from '../shared';

const amdDep = astMatcher('define([__anl_deps], __any)');
const namedAmdDep = astMatcher('define(__str, [__anl_deps], __any)');
const cjsDep = astMatcher('require(__any_dep)');

export default function(contents, replacement) {
  const toReplace = [];

  const _find = node => {
    if (node.type !== 'Literal') return;
    let dep = node.value;

    // remove tailing '/'
    if (dep.endsWith('/')) {
      dep = dep.slice(0, -1);
    }

    // remove tailing '.js', but only when dep is not
    // referencing a npm package main
    if (!isPackageName(dep)) {
      dep = stripJsExtension(dep);
    }

    // browser replacement;
    if (replacement && replacement[dep]) {
      dep = replacement[dep];
    }

    if (node.value !== dep) {
      toReplace.push({
        start: node.start, // .start for cherow, .range[0] for esprima
        end: node.end, // .end cherow, .range[1] for esprima
        text: `'${dep}'`
      });
    }
  };

  const parsed = ensureParsed(contents);

  const amdMatch = amdDep(parsed);
  if (amdMatch) {
    amdMatch.forEach(result => {
      result.match.deps.forEach(_find);
    });
  }

  const namedAmdMatch = namedAmdDep(parsed);
  if (namedAmdMatch) {
    namedAmdMatch.forEach(result => {
      result.match.deps.forEach(_find);
    });
  }

  const cjsMatch = cjsDep(parsed);
  if (cjsMatch) {
    cjsMatch.forEach(result => {
      _find(result.match.dep);
    });
  }

  // es6 import statement
  traverse(parsed, node => {
    if (node.type === 'ImportDeclaration') {
      _find(node.source);
    }
  })

  // reverse sort by "start"
  toReplace.sort((a, b) => b.start - a.start).forEach(r => {
    contents = modify(contents, r);
  });

  return contents;
}

function modify(contents, replacement) {
  return contents.slice(0, replacement.start) +
    replacement.text +
    contents.slice(replacement.end);
}
