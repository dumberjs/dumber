// replace transform is used by package-reader on every npm package

// browser replacement
// https://github.com/defunctzombie/package-browser-field-spec
// see trace.js for more details
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
      dep = dep.substr(0, dep.length - 1);
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
        start: node.range[0],
        end: node.range[1],
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
  toReplace.sort((a, b) => b.start - a.start);

  toReplace.forEach(r => {
    contents = modify(contents, r);
  });

  return contents;
}

function modify(contents, replacement) {
  return contents.substr(0, replacement.start) +
    replacement.text +
    contents.substr(replacement.end);
}
