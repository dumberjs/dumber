'use strict';
const esprima = require('esprima');
const astMatcher = require('ast-matcher');

function parser (contents) {
  return esprima.parse(contents, {range: true});
}

if (astMatcher.parser !== parser) {
  astMatcher.setParser(parser);
}